# ADR-004: Use Docker Compose With Internal Networking

Status: proposed

## Context

The repository already contains Dockerfiles for the deployable services. The VPS should run containers predictably without exposing each application directly to the internet.

## Decision

Use Docker Compose in later phases. Only Nginx should publish public ports. Application containers should be reachable only on an internal Docker network.

## Consequences

- The public attack surface is reduced.
- App ports remain internal implementation details.
- Health checks and restart policies must be defined in Compose.
- Operational scripts should verify that no application container has public host port bindings.
