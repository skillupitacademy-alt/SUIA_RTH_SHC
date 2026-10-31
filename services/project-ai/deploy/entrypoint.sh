#!/bin/sh
set -eu

: "${WORKSPACE_ROOT:=/workspace}"
export WORKSPACE_ROOT
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
pnpm install --frozen-lockfile --prod=false --ignore-scripts
export PROJECT_AI_SNAPSHOT_PATH="${PROJECT_AI_SNAPSHOT_PATH:-/var/lib/project-ai/state/snapshot.json}"
pnpm --filter @quiz/project-llm-discovery scan
python /opt/project-ai/preflight.py --browser
cd services/project-ai
# Single process plus file-backed job admission control; never --reload in production.
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 1
