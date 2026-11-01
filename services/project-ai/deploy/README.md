# Project LLM Linux Worker

This is an optional private service in the existing Hostinger Docker archive flow.
Normal web services remain source-free. Only this worker needs writable Git source
to place candidates, create exact-commit previews, and retain placement branches.

## Before Deploying

- Commit the reviewed changes. The worker image includes a private Git bundle of
  committed HEAD; builds refuse pending tracked or untracked changes. Never publish
  this image or archive: the bundle includes reachable repository history.
- Update the VPS runtime Compose/config/scripts using the existing
  `infra/hostinger/scripts/package-runtime-bundle.sh` process. Review the diff and
  back up existing configuration first. An image archive alone does not install a
  new Compose service. Do not overwrite live env files or certificates.
  The bundle includes this guide as `docs/project-ai-worker.md` and a template at
  `env/project-ai/worker.env.example`, never real worker credentials.
- Create `/opt/platform/env/project-ai/worker.env` from `worker.env.example` and
  mount a matching `learner-fixtures.json` there. Give the directory owner UID 1000
  and mode 0700, and files mode 0600. Never commit real values.
- Match signing and internal API secrets to the deployed services. Use container
  URLs, not Windows paths or local development ports. The fixture database must be
  explicitly approved for dedicated verification records; existing lesson content
  must not be reused as the mutable test fixture.
- Use the existing `app.verification.fixture_setup` tool only after reviewing its
  target database. It provisions reserved fixture records and writes local private
  configuration. Copy the catalog to the mounted config directory, set its worker
  path to `/etc/project-ai/learner-fixtures.json`, and use its dedicated learner UUID.
  This is a deliberate one-time operation, not an automatic deployment migration.
- Keep the public production learner test-session endpoint disabled. Fixture auth
  runs only inside isolated preview processes with the shared fixture secret.
- Set `PROJECT_AI_BACKEND=http://project-ai:8000` for the admin service; a stale
  override pointing to localhost will not reach the separate worker container.

## Existing Deployment Command

From the repository root, after the one-time configuration and verification:

```powershell
.\scripts\deploy-smart.ps1 -Services "project-ai","skillhubcore-admin","realtutorialhub-web","skillup-web" -SkipChecks -NoCache
```

`-SkipChecks` skips local lint/TypeScript checks, not worker startup or VPS health
checks. Run checks separately first. `-NoCache` forces an expensive fresh build;
it is not required for every deployment. Explicitly select `project-ai`; ordinary
default archive builds do not include the optional worker.

The worker starts non-root, installs lockfile dependencies into its managed Git
volume, checks configuration and Chromium, then starts one uvicorn process without
reload. Memory-intensive endpoints share one file lock; a concurrent job receives
409 and must retry. Startup may take up to 20 minutes on a cold dependency store.
Repository and worktree installs share the persistent repository's `.pnpm-store`
cache, but keep independent installed dependencies. Startup tries the frozen
lockfile offline first and retries online only for a missing cached tarball;
other install errors stop startup. No install diagnostics are suppressed.
Startup also regenerates the discovery snapshot at the worker commit into its
state volume, instead of reading the Windows-generated tracked snapshot. Preflight
requires the generated snapshot commit to match the worker HEAD.

Do not erase worker volumes during an update: they contain placement commits,
worktrees and evidence. An incompatible/non-fast-forward repository update stops
instead of resetting data. Image rollback alone may therefore need a deliberately
reviewed repository-volume restore. Back up volumes before worker upgrades.

## Local Pre-Deployment Smoke Tests

Build the toolchain without a source bundle or database credentials:

```powershell
docker build --target toolchain -f services/project-ai/Dockerfile -t quiz-platform-project-ai-toolchain:smoke .
docker run --rm --user 1000:1000 --security-opt no-new-privileges:true --shm-size 256m --add-host skillup.localhost:127.0.0.1 --add-host skillhubcore.localhost:127.0.0.1 -e WORKSPACE_ROOT=/tmp --mount "type=bind,source=$PWD/services/project-ai/deploy,target=/checks,readonly" quiz-platform-project-ai-toolchain:smoke python /checks/preflight.py --runtime-only --browser
docker run --rm --network none --user 1000:1000 --mount "type=bind,source=$PWD/services/project-ai,target=/source,readonly" quiz-platform-project-ai-toolchain:smoke python /source/deploy/smoke_linux.py
```

These tests verify Linux tooling, Chromium, locking and cleanup, not a real
authenticated fixture lifecycle. Full startup, exact-commit Next.js builds and
database-backed learner certification still require configured environment testing.

For a local-only authenticated diagnostic, `prepare_smoke_config.py` stages ignored
configuration from existing approved env files without provisioning a database.
`scripts/verification/export-learner-fixture.ts FAMILY VERSION OUTPUT_JSON` exports
a schema-validated generated registry default. The worker's
`verify_fixture_smoke.py --block-json PATH --allow-fixture-writes` runner uses the
dedicated fixture and restores it afterwards. It records screenshot/hash and
restoration checks, but never advances or certifies a workflow. Its local API URL
is `host.docker.internal:3011`, not a VPS deployment address.
When launching this standalone diagnostic via `docker exec`, pass
`-e npm_config_store_dir=/workspace/.pnpm-store` as well. Normal verification
requests already inherit this setting from the worker entrypoint; `docker exec`
does not inherit environment variables exported later by that entrypoint.

## Capacity and Proxy Limits

The worker is limited to one CPU and 3 GB RAM. Isolated admin and learner builds
also set Next.js static generation to one worker via `experimental.cpus`; normal
app builds are unchanged. These are containment limits, not a capacity guarantee
on an 8 GB VPS already running other services. Measure actual
free RAM/disk before deployment; dependency installs and preview builds need space.
Prefer a separate worker host if production apps cannot retain adequate headroom.

The admin adapter and origin Nginx allow up to 40 minutes for verification calls.
An upstream CDN can still impose a shorter hard timeout. Use an approved protected
DNS-only admin origin for these calls, or implement asynchronous job submission
and polling before routing them through such a CDN. Increasing origin timeouts does
not override CDN limits and is not proof of deployment readiness.

Do not expose port 8000 publicly or mount the Docker socket. Treat candidate code
as trusted administrator-supplied code: container limits are not a complete sandbox
against hostile uploads. The toolchain smoke tests do not write to a database.
The explicitly authorized authenticated diagnostic temporarily replaces only the
reserved fixture document and restores it afterwards; it never certifies a workflow
or deploys to the VPS.
