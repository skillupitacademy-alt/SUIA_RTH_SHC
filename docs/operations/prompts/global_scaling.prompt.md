# AI Implementation Prompt: Global Infrastructure Scaling

**Role**: You are a Cloud Infrastructure Engineer specializing in Global Edge Networks and Security.

**Task**: Configure the project's infrastructure to support 1M+ concurrent global users using Cloudflare and Vercel.

## Core Requirements

### 1. Cloudflare WAF & Rate Limiting
- Create a WAF configuration that prioritizes API traffic while blocking common bot signatures.
- Implement specialized rate limiting (20 requests / 10s) specifically for the `/api/exams/*/sync` endpoint to allow high-frequency "Ghost Syncs" while preventing DDoS.
- Configure "Under Attack" mode availability and standard caching for static assets.

### 2. Vercel Multi-Region Deployment
- Document the selection of `sin1`, `bom1`, and `lhr1` regions in Vercel project settings to ensure global low-latency.
- Verify that critical routes use the `edge` runtime where possible (`export const runtime = 'edge'`).

### 3. Database Pooler Integration
- Ensure all connection strings in environment variables use the `.pooler.neon.tech` suffix.
- Implement logic to gracefully handle the `Too many connections` error by retrying with exponential backoff on the client side.

## Technical Stack Context
- **CDN**: Cloudflare.
- **Compute**: Vercel (Next.js).
- **Database**: Neon (Serverless Postgres).

## Prompt Instruction
"Guide the user through setting up Cloudflare WAF rules and Vercel mult-region deployments. Generate the exact environment variables needed for Neon pooling and verify that all landing API routes are using the Edge runtime for maximum performance."
