# ADR-003: Use Nginx With Cloudflare Origin Certificates

Status: proposed

## Context

The platform uses Cloudflare as the public edge. The target SSL mode is Cloudflare Full (Strict), and the origin should be trusted by Cloudflare.

## Decision

Use Nginx as the VPS reverse proxy and terminate TLS with Cloudflare Origin Certificates.

## Consequences

- No Certbot renewal workflow is required for the origin certificate.
- Direct browser access to the VPS origin is not a goal.
- Cloudflare remains a required part of the public traffic path.
- Nginx can support fine-grained reverse proxy, headers, cache, rate limiting, and future load balancing.
