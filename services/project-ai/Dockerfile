FROM node:20-bookworm AS toolchain

ARG PLAYWRIGHT_VERSION=1.59.1
ENV VIRTUAL_ENV=/opt/project-ai-venv \
    PATH=/opt/project-ai-venv/bin:$PATH \
    PLAYWRIGHT_BROWSERS_PATH=/opt/playwright-browsers \
    PROJECT_AI_PLAYWRIGHT_VERSION=${PLAYWRIGHT_VERSION} \
    PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 python3-venv git tini ca-certificates \
    && python3 -m venv "$VIRTUAL_ENV" \
    && corepack enable && corepack prepare pnpm@9.15.4 --activate \
    && npm install --prefix /opt/browser-tooling "playwright@${PLAYWRIGHT_VERSION}" \
    && /opt/browser-tooling/node_modules/.bin/playwright install --with-deps chromium \
    && chmod -R a+rX /opt/playwright-browsers \
    && rm -rf /var/lib/apt/lists/*

COPY services/project-ai/pyproject.toml /opt/project-ai/pyproject.toml
RUN python -c "import tomllib,subprocess; d=tomllib.load(open('/opt/project-ai/pyproject.toml','rb')); subprocess.check_call(['pip','install','--no-cache-dir',*d['project']['dependencies']])"

FROM toolchain AS worker
COPY services/project-ai/deploy/entrypoint.sh /opt/project-ai/entrypoint.sh
COPY services/project-ai/deploy/preflight.py /opt/project-ai/preflight.py
# Created from committed HEAD by build-save-images.ps1; no workstation env files.
COPY services/project-ai/.build/source.bundle /opt/project-ai/source.bundle
RUN mkdir -p /workspace /var/lib/project-ai/worktrees /var/lib/project-ai/state \
    && chown -R node:node /workspace /var/lib/project-ai \
    && sed -i 's/\r$//' /opt/project-ai/entrypoint.sh \
    && chmod +x /opt/project-ai/entrypoint.sh

USER node
WORKDIR /workspace
ENTRYPOINT ["/usr/bin/tini", "--", "/opt/project-ai/entrypoint.sh"]
