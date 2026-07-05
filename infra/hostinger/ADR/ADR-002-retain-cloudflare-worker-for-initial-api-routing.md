# ADR-002: Retain Cloudflare Worker For Initial API Routing

Status: proposed

## Context

The Cloudflare Worker currently performs routing, path normalization, brand resolution, authentication checks for protected routes, and upstream forwarding behavior.

## Decision

For Phase 1 cutover planning, retain the Cloudflare Worker for API hosts while moving frontend compute to the VPS. API requests should continue through the Worker before reaching VPS origins.

## Consequences

- Existing API behavior is preserved during the riskiest migration phase.
- The VPS must expose reviewed origin routes that the Worker can reach.
- Worker route removal or replacement becomes a later, separate decision.
- Direct Nginx routing for API hosts is not assumed in Phase 1.
