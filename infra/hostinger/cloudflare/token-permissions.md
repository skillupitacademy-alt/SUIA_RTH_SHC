# Cloudflare Token Permissions

Status: required before frontend cutover.

The current migration tooling needs two permission levels:

## Origin API DNS Preparation

Required permissions:

- Zone: Read
- DNS: Read
- DNS: Edit

This is enough to create the `origin-api.*` records.

## Frontend Batch Cutover

Required permissions:

- Zone: Read
- DNS: Read
- DNS: Edit
- Workers Routes: Read
- Workers Routes: Edit

Frontend cutover needs Worker route access because frontend host routes must be removed from the Cloudflare Worker after DNS records are ready. Without Worker route permissions, the script refuses to mutate frontend DNS to avoid a partial cutover.

## Optional Backup Exports

Useful but not required for the cutover script:

- Account: Read
- Worker Scripts: Read
- Zone Settings: Read
- Rulesets: Read

If these are missing, the export helper records warnings and continues with the data it can read.
