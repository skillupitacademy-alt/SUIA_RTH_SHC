# Cloudflare Cutover Script

Status: prepared for review. Dry-run by default.

Use `apply-cloudflare-cutover.ps1` to apply the reviewed Cloudflare DNS cutover batches.

The script:

- reads `CLOUDFLARE_API_TOKEN` or `CloudFlare_API_TOKEN` from the local shell
- creates or updates reviewed `A` records to `72.61.115.49`
- optionally removes frontend Worker routes for selected batches when the token supports the legacy Worker Routes API
- refuses to touch excluded hostnames
- does nothing unless `-Apply` is provided

## Worker Route Requirement

Live checks show the current frontend hostnames are still handled by the Cloudflare Worker. A DNS-only update will not bypass an active Worker route.

The preferred path is to remove frontend routes by deploying the reviewed `services/api-gateway/wrangler.toml` change, while keeping API and placement routes in the Worker. See `worker-gateway-cutover.md`.

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

After `worker-gateway-cutover.md` is approved and the Worker deploy removes frontend routes, apply one frontend DNS batch at a time with DNS-only mode:

```powershell
.\infra\hostinger\cloudflare\apply-cloudflare-cutover.ps1 -Batch origin -Apply
.\infra\hostinger\cloudflare\apply-cloudflare-cutover.ps1 -Batch 1 -SkipWorkerRoutes -Apply
.\infra\hostinger\cloudflare\apply-cloudflare-cutover.ps1 -Batch 2 -SkipWorkerRoutes -Apply
.\infra\hostinger\cloudflare\apply-cloudflare-cutover.ps1 -Batch 3 -SkipWorkerRoutes -Apply
```

Do not use `-Batch all -Apply` for production cutover unless rollback evidence has been exported and the operator explicitly accepts the larger blast radius.

## Out Of Scope

The script does not update Worker routes or variables when `-SkipWorkerRoutes` is used. API Worker upstream changes and frontend route removal are handled by the reviewed Worker configuration in `services/api-gateway/wrangler.toml`.
