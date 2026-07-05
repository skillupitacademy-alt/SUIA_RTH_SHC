# Cloudflare Cutover Script

Status: prepared for review. Dry-run by default.

Use `apply-cloudflare-cutover.ps1` to apply the reviewed Cloudflare DNS and frontend Worker-route cutover batches.

The script:

- reads `CLOUDFLARE_API_TOKEN` or `CloudFlare_API_TOKEN` from the local shell
- creates or updates reviewed `A` records to `72.61.115.49`
- removes frontend Worker routes for selected batches
- refuses to touch excluded hostnames
- does nothing unless `-Apply` is provided

## Worker Route Requirement

Live checks show the current frontend hostnames are still handled by the Cloudflare Worker. A DNS-only update will not bypass an active Worker route.

For frontend batches, the default mode therefore requires Worker route read/edit access and removes frontend Worker routes as part of the cutover.

If Worker routes are removed manually in the Cloudflare dashboard first, run the script with `-SkipWorkerRoutes` to update DNS only:

```powershell
.\infra\hostinger\cloudflare\apply-cloudflare-cutover.ps1 -Batch 1 -SkipWorkerRoutes
.\infra\hostinger\cloudflare\apply-cloudflare-cutover.ps1 -Batch 1 -SkipWorkerRoutes -Apply
```

Do not use `-SkipWorkerRoutes` while the matching frontend Worker route is still active.

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

Then apply one batch at a time:

```powershell
.\infra\hostinger\cloudflare\apply-cloudflare-cutover.ps1 -Batch origin -Apply
.\infra\hostinger\cloudflare\apply-cloudflare-cutover.ps1 -Batch 1 -Apply
.\infra\hostinger\cloudflare\apply-cloudflare-cutover.ps1 -Batch 2 -Apply
.\infra\hostinger\cloudflare\apply-cloudflare-cutover.ps1 -Batch 3 -Apply
```

Do not use `-Batch all -Apply` for production cutover unless rollback evidence has been exported and the operator explicitly accepts the larger blast radius.

## Out Of Scope

The script does not update Worker environment variables. API Worker upstream changes must be reviewed separately after `origin-api.*` records exist and are validated.
