# Cloudflare Cutover Script

Status: prepared for review. Dry-run by default.

Use `apply-cloudflare-cutover.ps1` to apply reviewed Cloudflare DNS preparation and fallback cutover batches.

The script:

- reads `CLOUDFLARE_API_TOKEN` or `CloudFlare_API_TOKEN` from the local shell
- creates or updates reviewed `A` records to `72.61.115.49`
- optionally removes frontend Worker routes for selected batches when the token supports the legacy Worker Routes API
- refuses to touch excluded hostnames
- does nothing unless `-Apply` is provided

## Retained-Worker Origin Preparation

The preferred frontend architecture now keeps public frontend hostnames Worker-routed and switches Worker frontend upstreams to dedicated VPS origin hostnames.

In this path, `-Batch origin` prepares both API and frontend origin records:

```text
origin-api.*
origin-user.*
origin-admin.*
origin-faculty.*
origin-quiz.*
origin-tutorial.*
```

These records do not move public frontend traffic by themselves. They prepare Worker-to-VPS routing.

## Direct-DNS Fallback Requirement

Live checks show the current frontend hostnames are still handled by the Cloudflare Worker. A DNS-only update will not bypass an active Worker route.

Direct-DNS frontend cutover is now a fallback path. See `worker-gateway-cutover.md`.

For frontend batches, the script default still requires Worker route read/edit access and removes frontend Worker routes as part of the cutover. This is a conservative fallback for accounts where the Worker Routes API is available.

If frontend Worker routes are already removed by a Worker deploy or Cloudflare dashboard change, run the script with `-SkipWorkerRoutes` to update DNS only:

```powershell
.\infra\hostinger\cloudflare\apply-cloudflare-cutover.ps1 -Batch 1 -SkipWorkerRoutes
.\infra\hostinger\cloudflare\apply-cloudflare-cutover.ps1 -Batch 1 -SkipWorkerRoutes -Apply
```

Do not use `-SkipWorkerRoutes` while the matching frontend Worker route is still active. Verify first with `/internal/health`.

## Dry Run

```powershell
.\infra\hostinger\cloudflare\apply-cloudflare-cutover.ps1 -Batch origin
.\infra\hostinger\cloudflare\apply-cloudflare-cutover.ps1 -Batch 1
.\infra\hostinger\cloudflare\apply-cloudflare-cutover.ps1 -Batch 2
.\infra\hostinger\cloudflare\apply-cloudflare-cutover.ps1 -Batch 3
```

## Apply

Run the read-only export first:

```powershell
.\infra\hostinger\cloudflare\export-cloudflare-state.ps1
```

For the retained-Worker path, apply only the origin preparation batch:

```powershell
.\infra\hostinger\cloudflare\apply-cloudflare-cutover.ps1 -Batch origin -Apply
```

For the direct-DNS fallback path only, apply one frontend DNS batch at a time after frontend Worker routes are absent:

```powershell
.\infra\hostinger\cloudflare\apply-cloudflare-cutover.ps1 -Batch 1 -SkipWorkerRoutes -Apply
.\infra\hostinger\cloudflare\apply-cloudflare-cutover.ps1 -Batch 2 -SkipWorkerRoutes -Apply
.\infra\hostinger\cloudflare\apply-cloudflare-cutover.ps1 -Batch 3 -SkipWorkerRoutes -Apply
```

Do not use `-Batch all -Apply` for production cutover unless rollback evidence has been exported and the operator explicitly accepts the larger blast radius.

## Out Of Scope

The script does not update Worker routes or variables when `-SkipWorkerRoutes` is used. Worker upstream changes are handled by the reviewed Worker configuration in `services/api-gateway/wrangler.toml`.
