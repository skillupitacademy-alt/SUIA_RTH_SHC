# API Versioning Strategy

This document outlines the API versioning strategy for the Quiz Platform.

## Overview

The platform uses URL-based and header-based versioning to ensure backward compatibility and smooth transitions between API iterations.

### Current Version: `v1`

## Versioning Mechanisms

### 1. URL-based Versioning (Preferred)
All API requests should be prefixed with the version identifier:
`https://api.realtutorialhub.com/api/v1/...`

### 2. Header-based Versioning
Clients can also specify the desired version using the `Accept-Version` header:
`Accept-Version: v1`

## Middleware Implementation

The `api-version.middleware.ts` in the API server is responsible for:
1. Extracting the version from the URL path (e.g., `/api/v1/`).
2. Falling back to the `Accept-Version` header if the URL is not versioned.
3. Defaulting to `v1` if no version is provided.
4. Setting the `X-API-Version` response header.

## Deprecation Policy

When a version is deprecated, the following headers will be returned:
- `Deprecation: true`
- `Sunset: <ISO-8601 Date>` (The date when the version will be retired)

Example:
```http
HTTP/1.1 299 Deprecated
X-API-Version: v1
Deprecation: true
Sunset: 2026-12-31T23:59:59Z
```

## Client Integration

The `@quiz/api-client` package handles versioning automatically. The `FetchClient` is initialized with a default version and ensures all requests are correctly routed.

```typescript
const client = new FetchClient(BASE_URL, 'v1');
```
