# ADR-001: Move Compute From Cloud Run To Hostinger VPS

Status: proposed

## Context

The platform currently runs the main `asia-southeast1` stack on GCP Cloud Run. The target is to move compute to an already purchased Hostinger VPS while preserving rollback capability.

## Decision

Plan a staged migration from Cloud Run to Hostinger VPS for the `asia-southeast1` stack only. Keep Cloud Run active until the VPS has passed validation and a separate decommission review is completed.

## Consequences

- VPS operations become the platform owner's responsibility.
- Cost can be reduced if the VPS remains stable under load.
- Rollback remains possible while Cloud Run is retained.
- Monitoring, patching, backups, and capacity management must be explicitly owned.
