# Cloudflare Token Permissions

Status: required before frontend cutover.

The current migration tooling needs two permission levels:

## Origin API DNS Preparation

Required permissions:

- Zone: Read
- DNS: Read
- DNS: Edit

This is enough to create the `origin-api.*` records.

## Frontend Batch Cutover With Reviewed Worker Deploy

Preferred permissions:

- Zone: Read
- DNS: Read
- DNS: Edit

The recommended path is to remove frontend Worker routes by deploying the reviewed `services/api-gateway/wrangler.toml` change, while retaining API and placement Worker routes. After live verification shows frontend hostnames no longer execute the Worker, run DNS batches with `-SkipWorkerRoutes`.

This avoids depending on the legacy `/zones/{zoneId}/workers/routes` API permission, which is not available in every Cloudflare token UI.

## Frontend Batch Cutover With Worker Routes API

Required permissions:

- Zone: Read
- DNS: Read
- DNS: Edit
- Workers Routes: Read
- Workers Routes: Edit

This mode is only needed if the cutover script itself is expected to remove frontend Worker routes.

Frontend cutover needs Worker route access because frontend host routes must be removed from the Cloudflare Worker before DNS-only cutover can move traffic. Without Worker route permissions, the script refuses to mutate frontend DNS to avoid a partial cutover.

Live validation with `/internal/health` confirms frontend hostnames are currently served by the Worker. DNS-only changes will not move traffic while those routes remain active.

If a reviewed Worker deploy or Cloudflare dashboard operation removes frontend Worker routes first, the DNS script can be run with `-SkipWorkerRoutes`.

## Optional Backup Exports

Useful but not required for the cutover script:

- Account: Read
- Worker Scripts: Read
- Zone Settings: Read
- Rulesets: Read

If these are missing, the export helper records warnings and continues with the data it can read.
