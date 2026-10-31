#!/bin/sh
set -eu

: "${WORKSPACE_ROOT:=/workspace}"
export WORKSPACE_ROOT
export npm_config_store_dir="${npm_config_store_dir:-$WORKSPACE_ROOT/.pnpm-store}"
test -r "${PROJECT_AI_ENV_FILE:-/etc/project-ai/worker.env}" || {
  echo 'Missing private Project AI worker configuration.' >&2; exit 1;
}
cd "$WORKSPACE_ROOT"
if [ ! -d .git ]; then
  git init -b project-ai-base
fi
test -z "$(git status --porcelain --untracked-files=no)" || {
  echo 'Worker repository has modified tracked files; refusing to overwrite them.' >&2; exit 1;
}
git fetch /opt/project-ai/source.bundle HEAD
if git rev-parse --verify HEAD >/dev/null 2>&1; then
  git merge --ff-only FETCH_HEAD
else
  git checkout -B project-ai-base FETCH_HEAD
fi
git config user.name 'Project LLM Worker'
git config user.email 'project-llm-worker@localhost'
install_log=$(mktemp)
trap 'rm -f "$install_log"' EXIT
if pnpm install --frozen-lockfile --prod=false --ignore-scripts --offline >"$install_log" 2>&1; then
  cat "$install_log"
else
  cat "$install_log"
  grep -q 'ERR_PNPM_NO_OFFLINE_TARBALL' "$install_log" || exit 1
  pnpm install --frozen-lockfile --prod=false --ignore-scripts
fi
rm -f "$install_log"
trap - EXIT
export PROJECT_AI_SNAPSHOT_PATH="${PROJECT_AI_SNAPSHOT_PATH:-/var/lib/project-ai/state/snapshot.json}"
pnpm --filter @quiz/project-llm-discovery scan
python /opt/project-ai/preflight.py --browser
cd services/project-ai
# Single process plus file-backed job admission control; never --reload in production.
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 1
