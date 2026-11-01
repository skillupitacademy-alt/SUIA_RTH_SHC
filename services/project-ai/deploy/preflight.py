"""Linux worker readiness checks. Prints check names, never environment values."""
import argparse
import json
import os
from pathlib import Path
import shutil
import socket
import subprocess
import sys


def check(condition, label):
    print(f"{'PASS' if condition else 'FAIL'}: {label}", flush=True)
    if not condition:
        raise SystemExit(1)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--browser', action='store_true')
    parser.add_argument('--runtime-only', action='store_true')
    args = parser.parse_args()
    for command in ('git', 'node', 'pnpm'):
        check(bool(shutil.which(command)), f'{command} installed')
    for hostname in ('skillup.localhost', 'skillhubcore.localhost'):
        addresses = {item[4][0] for item in socket.getaddrinfo(hostname, None)}
        check('127.0.0.1' in addresses, f'{hostname} resolves to IPv4 loopback')
    root = Path(os.environ.get('WORKSPACE_ROOT', '/workspace'))
    if not args.runtime_only:
        from dotenv import load_dotenv
        check(load_dotenv(os.environ.get('PROJECT_AI_ENV_FILE', '/etc/project-ai/worker.env'), override=True),
              'worker configuration loaded')
        required = ('DATABASE_URL_TUTORIAL', 'ADMIN_JWT_SECRET', 'JWT_SECRET',
                    'PROJECT_LLM_VERIFICATION_DATABASE_URL', 'PROJECT_LLM_FIXTURE_SESSION_SECRET',
                    'PROJECT_LLM_TEST_LEARNER_ID', 'PROJECT_LLM_LEARNER_FIXTURE_CATALOG_PATH')
        for name in required:
            check(bool(os.environ.get(name)), f'{name} configured')
        check(len(os.environ['PROJECT_LLM_FIXTURE_SESSION_SECRET']) >= 32, 'fixture secret length')
        check((root / '.git').exists(), 'managed Git repository')
        check(os.access(root, os.W_OK), 'repository writable')
        snapshot_path = Path(os.environ.get('PROJECT_AI_SNAPSHOT_PATH', '/var/lib/project-ai/state/snapshot.json'))
        check(snapshot_path.is_file(), 'native discovery snapshot generated')
        snapshot = json.loads(snapshot_path.read_text())
        head = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root, text=True).strip()
        check(snapshot.get('repository', {}).get('commitSha') == head, 'discovery snapshot matches worker commit')
        sys.path.insert(0, str(root / 'services/project-ai'))
        from app.verification.fixture_environment import verification_database_url
        verification_database_url()
        check(Path(os.environ['PROJECT_LLM_LEARNER_FIXTURE_CATALOG_PATH']).is_file(), 'fixture catalog mounted')
        check(os.environ.get('PROJECT_LLM_EXECUTION_MODE') == 'isolated_worker', 'isolated-worker mode')
        endpoint = os.environ.get('PROJECT_LLM_LEARNER_API_BASE_URL', '')
        check(bool(endpoint) and 'localhost' not in endpoint, 'ILS API uses container/service address')
        version = subprocess.check_output(['node', '-p', "require('playwright/package.json').version"], cwd=root, text=True).strip()
        check(version == os.environ.get('PROJECT_AI_PLAYWRIGHT_VERSION'), 'browser and repository Playwright versions match')
    if args.browser:
        module = '/opt/browser-tooling/node_modules/playwright' if args.runtime_only else str(root / 'node_modules/playwright')
        script = "const {chromium}=require(" + json.dumps(module) + "); (async()=>{const b=await chromium.launch({headless:true});try{const p=await b.newPage();await p.setContent('<h1>Worker ready</h1>');if(await p.title()!=='')throw Error('Unexpected page');}finally{await b.close()}})().catch(()=>process.exit(1));"
        subprocess.run(['node', '-e', script], cwd=root, check=True, timeout=30)
        check(True, 'headless Chromium launch and render')


if __name__ == '__main__':
    main()
