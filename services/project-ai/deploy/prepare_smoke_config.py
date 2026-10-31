"""Generate ignored local-only worker configuration; never prints secret values."""

import json
from pathlib import Path
import shutil

from dotenv import dotenv_values


def main():
    root = Path(__file__).resolve().parents[3]
    output = root / '.project-ai/linux-worker-smoke'
    settings = {}
    for name in ('.env.local', 'apps/skillhubcore-admin/.env.local', 'apps/api-server/.env.local',
                 '.project-ai/learner-runtime.env'):
        path = root / name
        if path.is_file():
            settings.update({key: value for key, value in dotenv_values(path).items() if value is not None})
    required = ('DATABASE_URL_TUTORIAL', 'JWT_SECRET', 'ADMIN_JWT_SECRET',
                'PROJECT_LLM_VERIFICATION_DATABASE_URL', 'PROJECT_LLM_FIXTURE_SESSION_SECRET',
                'PROJECT_LLM_TEST_LEARNER_ID')
    missing = [name for name in required if not settings.get(name)]
    if missing:
        raise SystemExit('Missing configuration keys: ' + ', '.join(missing))
    source_catalog = root / '.project-ai/learner-fixtures.json'
    if not source_catalog.is_file():
        raise SystemExit('Existing approved fixture catalog is required; no database setup is performed')
    output.mkdir(mode=0o700, parents=True, exist_ok=True)
    shutil.copyfile(source_catalog, output / 'learner-fixtures.json')
    settings.update({
        'PROJECT_LLM_EXECUTION_MODE': 'isolated_worker',
        'PROJECT_LLM_LOCAL_VERIFICATION': 'false',
        'PROJECT_LLM_LEARNER_FIXTURE_CATALOG_PATH': '/etc/project-ai/learner-fixtures.json',
        'PROJECT_LLM_LEARNER_API_BASE_URL': 'http://host.docker.internal:3011/api',
        'INTERNAL_API_URL': 'http://host.docker.internal:3011/api',
        'API_SERVER_URL': 'http://host.docker.internal:3011/api',
        'GATEWAY_URL': 'http://host.docker.internal:3011/api',
        'ENVIRONMENT': 'verification',
        'APP_ENV': 'verification',
    })
    # Only the mounted environment receives credentials, never Docker build args.
    allowed_prefixes = ('DATABASE_', 'JWT_', 'ADMIN_JWT_', 'INTERNAL_', 'PROJECT_LLM_',
                        'NEXT_PUBLIC_', 'API_SERVER_', 'GATEWAY_')
    selected = {key: value for key, value in settings.items()
                if key.startswith(allowed_prefixes) or key in ('ENVIRONMENT', 'APP_ENV')}
    target = output / 'worker.env'
    target.write_text('\n'.join(f'{key}={json.dumps(value)}' for key, value in selected.items()) + '\n', encoding='utf-8')
    target.chmod(0o600)
    (output / 'learner-fixtures.json').chmod(0o600)
    print('Prepared ignored local smoke configuration; no secrets printed and no database writes performed.')


if __name__ == '__main__':
    main()
