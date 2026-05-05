# 04 - API GATEWAY ARCHITECTURE
## Intelligent Routing and Service Management

---

## **1. OVERVIEW**

### **1.1 What is an API Gateway?**

An **API Gateway** is a server that acts as an entry point for all client requests. It sits between clients and backend services, providing:

```
┌─────────────────────────────────────────────────────────────┐
│ API GATEWAY PATTERN                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Clients (Web, Mobile, Admin)                               │
│         │                                                   │
│         ↓                                                   │
│  ┌─────────────────┐                                        │
│  │  API GATEWAY    │  ← Single entry point                 │
│  │  ├─ Routing     │                                        │
│  │  ├─ Auth        │                                        │
│  │  ├─ Rate Limit  │                                        │
│  │  └─ Discovery   │                                        │
│  └─────────────────┘                                        │
│         │                                                   │
│         ├──────────┬──────────┬──────────┐                 │
│         ↓          ↓          ↓          ↓                 │
│    Identity   Tutorial    Exam     Placement               │
│    Service    Engine      Engine    Engine                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### **1.2 Why Do You Need It?**

**Current Problem** (Cloudflare Worker):
```typescript
// Simple brand-based routing
if (hostname.includes('skillup')) {
  forward to quiz-api-server with X-Brand: skillup
} else {
  forward to quiz-api-server with X-Brand: realtutorialhub
}
```

**Issues**:
- ❌ Routes to single monolithic server
- ❌ No service discovery
- ❌ No circuit breaker
- ❌ No per-tenant rate limiting
- ❌ No distributed tracing
- ❌ Hardcoded routing logic

**Proposed Solution** (API Gateway):
```typescript
// Intelligent tenant-aware routing
1. Resolve tenant from hostname
2. Authenticate request (JWT validation)
3. Determine target service from path
4. Discover service instance (load balancing)
5. Check circuit breaker status
6. Apply rate limiting (per-tenant)
7. Forward request with tenant context
8. Collect metrics and traces
```

---

## **2. GATEWAY RESPONSIBILITIES**

### **2.1 Core Responsibilities**

#### **1. Tenant Resolution**
```typescript
// Resolve tenant from hostname
async function resolveTenant(hostname: string): Promise<Tenant> {
  // Check cache first
  const cached = await cache.get(`tenant:${hostname}`);
  if (cached) return cached;
  
  // Query database
  const tenant = await db
    .select()
    .from(tenants)
    .where(eq(tenants.domain, hostname))
    .limit(1);
  
  if (!tenant) {
    throw new Error('Tenant not found');
  }
  
  // Cache for 5 minutes
  await cache.set(`tenant:${hostname}`, tenant, 300);
  
  return tenant;
}

// Example:
// skillupitacademy.com → { id: 'tenant-1', slug: 'skillup' }
// realtutorialhub.com → { id: 'tenant-2', slug: 'realtutorialhub' }
```

#### **2. Authentication**
```typescript
// Validate JWT token
async function authenticate(request: Request): Promise<AuthContext> {
  const token = extractToken(request);
  
  if (!token) {
    throw new UnauthorizedError('Missing token');
  }
  
  // Verify JWT
  const payload = await verifyJWT(token, JWT_SECRET);
  
  // Check if token is revoked
  const isRevoked = await cache.get(`revoked:${payload.jti}`);
  if (isRevoked) {
    throw new UnauthorizedError('Token revoked');
  }
  
  return {
    userId: payload.userId,
    tenantId: payload.tenantId,
    roles: payload.roles,
    permissions: payload.permissions
  };
}
```

#### **3. Service Discovery**
```typescript
// Discover service instance
async function discoverService(serviceName: string): Promise<string> {
  // Get all healthy instances
  const instances = await serviceRegistry.getInstances(serviceName);
  
  if (instances.length === 0) {
    throw new ServiceUnavailableError(`No instances for ${serviceName}`);
  }
  
  // Load balancing (round-robin)
  const instance = instances[currentIndex % instances.length];
  currentIndex++;
  
  return instance.url;
}

// Example:
// tutorial-engine → https://tutorial-engine-abc123.run.app
// exam-engine → https://exam-engine-def456.run.app
```

#### **4. Routing**
```typescript
// Route request to appropriate service
async function route(request: Request, tenant: Tenant): Promise<string> {
  const pathname = new URL(request.url).pathname;
  
  // Route mapping
  const routes = {
    '/auth/*': 'identity-service',
    '/users/*': 'identity-service',
    '/tutorials/*': 'tutorial-engine',
    '/chapters/*': 'tutorial-engine',
    '/exams/*': 'exam-engine',
    '/questions/*': 'exam-engine',
    '/jobs/*': 'placement-engine',
    '/applications/*': 'placement-engine',
    '/payments/*': 'payment-engine',
    '/notifications/*': 'notification-engine'
  };
  
  // Find matching route
  for (const [pattern, service] of Object.entries(routes)) {
    if (matchPattern(pathname, pattern)) {
      return service;
    }
  }
  
  throw new NotFoundError('Route not found');
}
```

#### **5. Rate Limiting**
```typescript
// Per-tenant rate limiting
async function checkRateLimit(
  tenantId: string,
  endpoint: string
): Promise<void> {
  const key = `ratelimit:${tenantId}:${endpoint}`;
  
  // Get current count
  const count = await redis.incr(key);
  
  // Set expiry on first request
  if (count === 1) {
    await redis.expire(key, 60); // 1 minute window
  }
  
  // Check limit (1000 requests per minute per tenant)
  if (count > 1000) {
    throw new RateLimitError('Rate limit exceeded');
  }
}
```

#### **6. Circuit Breaker**
```typescript
// Circuit breaker pattern
class CircuitBreaker {
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private failureCount = 0;
  private lastFailureTime = 0;
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // If circuit is open, fail fast
    if (this.state === 'open') {
      // Check if timeout has passed
      if (Date.now() - this.lastFailureTime > 30000) {
        this.state = 'half-open';
      } else {
        throw new ServiceUnavailableError('Circuit breaker open');
      }
    }
    
    try {
      const result = await fn();
      
      // Success - reset circuit
      if (this.state === 'half-open') {
        this.state = 'closed';
        this.failureCount = 0;
      }
      
      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();
      
      // Open circuit after 5 failures
      if (this.failureCount >= 5) {
        this.state = 'open';
      }
      
      throw error;
    }
  }
}
```

---

## **3. GATEWAY ARCHITECTURE**

### **3.1 Technology Options**

#### **Option 1: Kong Gateway (Recommended)**

**Pros**:
- ✅ Open-source and battle-tested
- ✅ Rich plugin ecosystem
- ✅ Excellent performance
- ✅ Easy to extend
- ✅ Great documentation

**Cons**:
- ❌ Requires PostgreSQL for config
- ❌ Learning curve

**Cost**: Free (open-source) + infrastructure

#### **Option 2: AWS API Gateway**

**Pros**:
- ✅ Fully managed
- ✅ Integrates with AWS services
- ✅ Auto-scaling
- ✅ Pay-per-use

**Cons**:
- ❌ Vendor lock-in
- ❌ Limited customization
- ❌ Can be expensive at scale

**Cost**: $3.50 per million requests

#### **Option 3: Google Cloud API Gateway**

**Pros**:
- ✅ Fully managed
- ✅ Integrates with GCP services
- ✅ OpenAPI support

**Cons**:
- ❌ Vendor lock-in
- ❌ Less mature than AWS

**Cost**: $3.00 per million requests

#### **Option 4: Custom Gateway (Node.js/Express)**

**Pros**:
- ✅ Full control
- ✅ No vendor lock-in
- ✅ Easy to customize

**Cons**:
- ❌ Must build everything
- ❌ Maintenance burden
- ❌ Scaling complexity

**Cost**: Infrastructure only

### **3.2 Recommended Architecture (Kong Gateway)**

```
┌─────────────────────────────────────────────────────────────┐
│ KONG GATEWAY ARCHITECTURE                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────┐               │
│  │  KONG GATEWAY (Cloud Run)               │               │
│  │  ├─ Tenant Resolver Plugin              │               │
│  │  ├─ Authentication Plugin               │               │
│  │  ├─ Rate Limiting Plugin                │               │
│  │  ├─ Circuit Breaker Plugin              │               │
│  │  ├─ Logging Plugin                      │               │
│  │  └─ Tracing Plugin                      │               │
│  └─────────────────────────────────────────┘               │
│         │                                                   │
│         ├─ PostgreSQL (Config DB)                          │
│         ├─ Redis (Rate Limiting)                           │
│         └─ Service Registry (Consul/Eureka)                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## **4. IMPLEMENTATION**

### **4.1 Kong Gateway Setup**

#### **Step 1: Install Kong**

```yaml
# docker-compose.yml
version: '3.8'

services:
  kong-database:
    image: postgres:15
    environment:
      POSTGRES_USER: kong
      POSTGRES_DB: kong
      POSTGRES_PASSWORD: kong
    volumes:
      - kong-db:/var/lib/postgresql/data
  
  kong-migrations:
    image: kong:3.4
    command: kong migrations bootstrap
    environment:
      KONG_DATABASE: postgres
      KONG_PG_HOST: kong-database
      KONG_PG_USER: kong
      KONG_PG_PASSWORD: kong
    depends_on:
      - kong-database
  
  kong:
    image: kong:3.4
    environment:
      KONG_DATABASE: postgres
      KONG_PG_HOST: kong-database
      KONG_PG_USER: kong
      KONG_PG_PASSWORD: kong
      KONG_PROXY_ACCESS_LOG: /dev/stdout
      KONG_ADMIN_ACCESS_LOG: /dev/stdout
      KONG_PROXY_ERROR_LOG: /dev/stderr
      KONG_ADMIN_ERROR_LOG: /dev/stderr
      KONG_ADMIN_LISTEN: 0.0.0.0:8001
    ports:
      - "8000:8000"  # Proxy
      - "8001:8001"  # Admin API
    depends_on:
      - kong-database
      - kong-migrations

volumes:
  kong-db:
```

#### **Step 2: Configure Services**

```bash
# Add Identity Service
curl -X POST http://localhost:8001/services \
  --data name=identity-service \
  --data url=https://identity-service.run.app

# Add Tutorial Engine
curl -X POST http://localhost:8001/services \
  --data name=tutorial-engine \
  --data url=https://tutorial-engine.run.app

# Add Exam Engine
curl -X POST http://localhost:8001/services \
  --data name=exam-engine \
  --data url=https://exam-engine.run.app
```

#### **Step 3: Configure Routes**

```bash
# Identity Service routes
curl -X POST http://localhost:8001/services/identity-service/routes \
  --data 'paths[]=/auth' \
  --data 'paths[]=/users'

# Tutorial Engine routes
curl -X POST http://localhost:8001/services/tutorial-engine/routes \
  --data 'paths[]=/tutorials' \
  --data 'paths[]=/chapters'

# Exam Engine routes
curl -X POST http://localhost:8001/services/exam-engine/routes \
  --data 'paths[]=/exams' \
  --data 'paths[]=/questions'
```

#### **Step 4: Add Plugins**

```bash
# Rate Limiting (per-tenant)
curl -X POST http://localhost:8001/plugins \
  --data name=rate-limiting \
  --data config.minute=1000 \
  --data config.policy=redis \
  --data config.redis_host=redis

# JWT Authentication
curl -X POST http://localhost:8001/plugins \
  --data name=jwt \
  --data config.key_claim_name=kid

# Request Transformer (add tenant context)
curl -X POST http://localhost:8001/plugins \
  --data name=request-transformer \
  --data config.add.headers=X-Tenant-ID:${tenant_id}
```

### **4.2 Custom Tenant Resolver Plugin**

```lua
-- kong/plugins/tenant-resolver/handler.lua
local TenantResolverHandler = {
  PRIORITY = 1000,
  VERSION = "1.0.0"
}

function TenantResolverHandler:access(conf)
  local hostname = kong.request.get_host()
  
  -- Query tenant from database
  local tenant = kong.cache:get(
    "tenant:" .. hostname,
    { ttl = 300 },
    function()
      -- Query PostgreSQL
      local pg = require("pgmoon")
      local db = pg.new({
        host = conf.db_host,
        port = conf.db_port,
        database = conf.db_name,
        user = conf.db_user,
        password = conf.db_password
      })
      
      db:connect()
      
      local result = db:query(
        "SELECT id, slug FROM tenants WHERE domain = " .. 
        db:escape_literal(hostname)
      )
      
      db:disconnect()
      
      return result[1]
    end
  )
  
  if not tenant then
    return kong.response.exit(404, { message = "Tenant not found" })
  end
  
  -- Set tenant context
  kong.ctx.shared.tenant_id = tenant.id
  kong.ctx.shared.tenant_slug = tenant.slug
  
  -- Add headers for downstream services
  kong.service.request.set_header("X-Tenant-ID", tenant.id)
  kong.service.request.set_header("X-Tenant-Slug", tenant.slug)
end

return TenantResolverHandler
```

### **4.3 Gateway Request Flow**

```typescript
// Complete request flow
async function handleRequest(request: Request): Promise<Response> {
  try {
    // 1. Resolve tenant
    const hostname = new URL(request.url).hostname;
    const tenant = await resolveTenant(hostname);
    
    // 2. Authenticate (if required)
    let authContext = null;
    if (requiresAuth(request.url)) {
      authContext = await authenticate(request);
      
      // Verify tenant membership
      if (authContext.tenantId !== tenant.id) {
        throw new ForbiddenError('User not in tenant');
      }
    }
    
    // 3. Check rate limit
    await checkRateLimit(tenant.id, request.url);
    
    // 4. Determine target service
    const serviceName = await route(request, tenant);
    
    // 5. Check circuit breaker
    const circuitBreaker = getCircuitBreaker(serviceName);
    
    // 6. Discover service instance
    const serviceUrl = await discoverService(serviceName);
    
    // 7. Forward request
    const response = await circuitBreaker.execute(async () => {
      return await fetch(serviceUrl + request.url, {
        method: request.method,
        headers: {
          ...request.headers,
          'X-Tenant-ID': tenant.id,
          'X-Tenant-Slug': tenant.slug,
          'X-User-ID': authContext?.userId,
          'X-Trace-ID': generateTraceId()
        },
        body: request.body
      });
    });
    
    // 8. Record metrics
    await recordMetrics({
      tenant: tenant.slug,
      service: serviceName,
      method: request.method,
      path: request.url,
      status: response.status,
      duration: Date.now() - startTime
    });
    
    return response;
    
  } catch (error) {
    // Error handling
    if (error instanceof RateLimitError) {
      return new Response('Rate limit exceeded', { status: 429 });
    }
    
    if (error instanceof UnauthorizedError) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    if (error instanceof ServiceUnavailableError) {
      return new Response('Service unavailable', { status: 503 });
    }
    
    // Log error
    logger.error('Gateway error', { error, request });
    
    return new Response('Internal server error', { status: 500 });
  }
}
```

---

## **5. ADVANCED FEATURES**

### **5.1 Service Discovery**

#### **Option 1: Consul**

```typescript
// Register service with Consul
import Consul from 'consul';

const consul = new Consul({
  host: 'consul.example.com',
  port: 8500
});

// Register service
await consul.agent.service.register({
  id: 'tutorial-engine-1',
  name: 'tutorial-engine',
  address: 'tutorial-engine-abc123.run.app',
  port: 443,
  check: {
    http: 'https://tutorial-engine-abc123.run.app/health',
    interval: '10s',
    timeout: '5s'
  }
});

// Discover service
const services = await consul.health.service({
  service: 'tutorial-engine',
  passing: true
});

const instance = services[0];
console.log(instance.Service.Address); // tutorial-engine-abc123.run.app
```

#### **Option 2: Kubernetes Service Discovery**

```yaml
# tutorial-engine-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: tutorial-engine
spec:
  selector:
    app: tutorial-engine
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: ClusterIP
```

```typescript
// Gateway discovers via Kubernetes DNS
const serviceUrl = 'http://tutorial-engine.default.svc.cluster.local';
```

### **5.2 Load Balancing Strategies**

#### **Round Robin**
```typescript
let currentIndex = 0;

function roundRobin(instances: ServiceInstance[]): ServiceInstance {
  const instance = instances[currentIndex % instances.length];
  currentIndex++;
  return instance;
}
```

#### **Least Connections**
```typescript
function leastConnections(instances: ServiceInstance[]): ServiceInstance {
  return instances.reduce((min, instance) => 
    instance.activeConnections < min.activeConnections ? instance : min
  );
}
```

#### **Weighted Round Robin**
```typescript
function weightedRoundRobin(instances: ServiceInstance[]): ServiceInstance {
  const totalWeight = instances.reduce((sum, i) => sum + i.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const instance of instances) {
    random -= instance.weight;
    if (random <= 0) {
      return instance;
    }
  }
  
  return instances[0];
}
```

### **5.3 Caching**

```typescript
// Response caching
async function cacheResponse(
  key: string,
  fn: () => Promise<Response>,
  ttl: number
): Promise<Response> {
  // Check cache
  const cached = await redis.get(key);
  if (cached) {
    return new Response(cached, {
      headers: { 'X-Cache': 'HIT' }
    });
  }
  
  // Execute function
  const response = await fn();
  
  // Cache response
  if (response.ok) {
    await redis.setex(key, ttl, await response.text());
  }
  
  return response;
}

// Usage
const response = await cacheResponse(
  `tutorials:${tenantId}:list`,
  () => fetch(tutorialEngineUrl + '/tutorials'),
  300 // 5 minutes
);
```

---

## **6. MONITORING AND OBSERVABILITY**

### **6.1 Metrics**

```typescript
// Prometheus metrics
import { Counter, Histogram, Gauge } from 'prom-client';

// Request counter
const requestCounter = new Counter({
  name: 'gateway_requests_total',
  help: 'Total number of requests',
  labelNames: ['tenant', 'service', 'method', 'status']
});

// Request duration
const requestDuration = new Histogram({
  name: 'gateway_request_duration_seconds',
  help: 'Request duration in seconds',
  labelNames: ['tenant', 'service', 'method'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

// Active connections
const activeConnections = new Gauge({
  name: 'gateway_active_connections',
  help: 'Number of active connections',
  labelNames: ['service']
});

// Record metrics
requestCounter.inc({
  tenant: 'skillup',
  service: 'tutorial-engine',
  method: 'GET',
  status: '200'
});

requestDuration.observe({
  tenant: 'skillup',
  service: 'tutorial-engine',
  method: 'GET'
}, 0.234);
```

### **6.2 Distributed Tracing**

```typescript
// OpenTelemetry tracing
import { trace, context } from '@opentelemetry/api';

const tracer = trace.getTracer('api-gateway');

async function handleRequest(request: Request): Promise<Response> {
  // Start span
  const span = tracer.startSpan('gateway.request', {
    attributes: {
      'http.method': request.method,
      'http.url': request.url,
      'tenant.id': tenant.id
    }
  });
  
  try {
    // Resolve tenant
    const tenantSpan = tracer.startSpan('gateway.resolve_tenant', {
      parent: span
    });
    const tenant = await resolveTenant(hostname);
    tenantSpan.end();
    
    // Authenticate
    const authSpan = tracer.startSpan('gateway.authenticate', {
      parent: span
    });
    const authContext = await authenticate(request);
    authSpan.end();
    
    // Forward request
    const forwardSpan = tracer.startSpan('gateway.forward', {
      parent: span,
      attributes: {
        'service.name': serviceName
      }
    });
    const response = await forwardRequest(request);
    forwardSpan.end();
    
    span.setStatus({ code: SpanStatusCode.OK });
    return response;
    
  } catch (error) {
    span.recordException(error);
    span.setStatus({ code: SpanStatusCode.ERROR });
    throw error;
    
  } finally {
    span.end();
  }
}
```

---

## **7. DEPLOYMENT**

### **7.1 Cloud Run Deployment**

```yaml
# gateway.yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: api-gateway
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/minScale: "2"
        autoscaling.knative.dev/maxScale: "100"
    spec:
      containers:
        - image: gcr.io/project/api-gateway:latest
          ports:
            - containerPort: 8080
          env:
            - name: REDIS_URL
              value: redis://redis:6379
            - name: CONSUL_URL
              value: http://consul:8500
          resources:
            limits:
              cpu: "2"
              memory: "1Gi"
```

### **7.2 Kubernetes Deployment**

```yaml
# gateway-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
    spec:
      containers:
        - name: gateway
          image: gcr.io/project/api-gateway:latest
          ports:
            - containerPort: 8080
          env:
            - name: REDIS_URL
              valueFrom:
                secretKeyRef:
                  name: gateway-secrets
                  key: redis-url
          resources:
            requests:
              cpu: "500m"
              memory: "512Mi"
            limits:
              cpu: "2"
              memory: "1Gi"
          livenessProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: api-gateway
spec:
  selector:
    app: api-gateway
  ports:
    - protocol: TCP
      port: 80
      targetPort: 8080
  type: LoadBalancer
```

---

## **8. SUMMARY**

### **8.1 Key Takeaways**

✅ **API Gateway is the single entry point** for all client requests

✅ **Handles cross-cutting concerns**:
- Tenant resolution
- Authentication
- Rate limiting
- Circuit breaking
- Service discovery
- Load balancing

✅ **Recommended Technology**: Kong Gateway (open-source, battle-tested)

✅ **Deployment**: Cloud Run or Kubernetes

✅ **Observability**: Prometheus metrics + OpenTelemetry tracing

### **8.2 Benefits**

- ✅ Centralized routing logic
- ✅ Consistent authentication
- ✅ Per-tenant rate limiting
- ✅ Service resilience (circuit breaker)
- ✅ Easy to add new services
- ✅ Better observability

---

**Next Document**: 05-BFF-PATTERN.md (Backend for Frontend pattern)
