# AI Implementation Prompt: Scaling Phase 4 (Hyper-Scale)

**Objective**: Finalize global distribution and resilience to support millions of users across multiple geographic regions with zero downtime.

---

## CONTEXT
The app must survive region-wide cloud outages and serve millions of users with sub-50ms latency globally.

## INSTRUCTIONS
Please execute the following:

1. **Multi-Region Routing**:
   - Configure/Documentation for Vercel Multi-Region deployments.
   - Ensure the Backend logic uses `Request.geo` to direct users to the nearest regional DB replicas.

2. **Edge Cache Strategy**:
   - Audit all `page.tsx` files.
   - Implement aggressive `revalidateTag` based caching on a global scale.
   - Ensure 100% of the Static Assets and Exam UI are served from the Edge CDN.

3. **Circuit Breaker Implementation**:
   - Create a `ResilienceManager` utility.
   - Implement a "High Load Mode" toggle.
   - If enabled, the app should bypass AI Analytics and Heavy Graph rendering, serving only the core Exam Result numbers to save CPU.

4. **Global Rate Limiting**:
   - Implement an "Edge Firewall" logic in `middleware.ts` using Redis-based sliding window rate limiting.
   - Protect the `/api/auth` and `/api/submit` routes from planetary-scale burst traffic.

## OUTPUT
Provide the code for the `ResilienceManager` and the updated Global Middleware with rate-limiting logic.
