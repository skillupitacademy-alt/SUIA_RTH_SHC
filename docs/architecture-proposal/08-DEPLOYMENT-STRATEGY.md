# 08 - DEPLOYMENT STRATEGY
## Cloud Run, CI/CD, and Deployment Patterns

---

## **1. OVERVIEW**

### **1.1 Deployment Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│ DEPLOYMENT STACK                                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Infrastructure Layer                                       │
│  ├─ Google Cloud Platform (GCP)                             │
│  ├─ Cloud Run (Serverless Containers)                       │
│  ├─ Cloud Load Balancing                                    │
│  └─ Cloud CDN                                               │
│                                                             │
│  Container Layer                                            │
│  ├─ Docker containers                                       │
│  ├─ Artifact Registry                                       │
│  └─ Container scanning                                      │
│                                                             │
│  CI/CD Layer                                                │
│  ├─ GitHub Actions                                          │
│  ├─ Automated testing                                       │
│  ├─ Automated deployment                                    │
│  └─ Rollback automation                                     │
│                                                             │
│  Monitoring Layer                                           │
│  ├─ Cloud Monitoring                                        │
│  ├─ Cloud Logging                                           │
│  ├─ Error Reporting                                         │
│  └─ Uptime Checks                                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## **2. CLOUD RUN VS KUBERNETES**

### **2.1 Comparison**

| Feature | Cloud Run | Kubernetes (GKE) |
|---------|-----------|------------------|
| **Complexity** | Low | High |
| **Management** | Fully managed | Self-managed |
| **Scaling** | Automatic (0 to N) | Manual configuration |
| **Cost** | Pay per request | Pay for nodes |
| **Cold Start** | 1-3 seconds | None |
| **Max Instances** | 1000 per service | Unlimited |
| **Networking** | Simplified | Full control |
| **Service Mesh** | Not needed | Istio/Linkerd |
| **Learning Curve** | Easy | Steep |

### **2.2 Recommendation: Cloud Run**

**Why Cloud Run?**

✅ **Simplicity**
- No cluster management
- No node provisioning
- No capacity planning

✅ **Cost-Effective**
- Scale to zero when idle
- Pay only for actual usage
- No idle infrastructure costs

✅ **Fast Deployment**
- Deploy in seconds
- Automatic HTTPS
- Built-in load balancing

✅ **Perfect for Microservices**
- Each service deploys independently
- Automatic scaling per service
- Built-in traffic splitting

**When to use Kubernetes instead?**

- Need advanced networking (service mesh)
- Need stateful workloads (databases)
- Need GPU/TPU workloads
- Need very low latency (no cold starts)
- Team has Kubernetes expertise

**For your platform**: Cloud Run is the right choice.

---

## **3. CLOUD RUN ARCHITECTURE**

### **3.1 Service Deployment**

```
┌─────────────────────────────────────────────────────────────┐
│ CLOUD RUN SERVICES                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Region: asia-southeast1 (Singapore)                        │
│                                                             │
│  ├─ identity-service                                        │
│  │   ├─ Min instances: 1                                    │
│  │   ├─ Max instances: 100                                  │
│  │   ├─ CPU: 1                                              │
│  │   ├─ Memory: 512Mi                                       │
│  │   └─ Concurrency: 80                                     │
│  │                                                           │
│  ├─ tutorial-service                                        │
│  │   ├─ Min instances: 0                                    │
│  │   ├─ Max instances: 100                                  │
│  │   ├─ CPU: 1                                              │
│  │   ├─ Memory: 1Gi                                         │
│  │   └─ Concurrency: 80                                     │
│  │                                                           │
│  ├─ exam-service                                            │
│  │   ├─ Min instances: 0                                    │
│  │   ├─ Max instances: 50                                   │
│  │   ├─ CPU: 2                                              │
│  │   ├─ Memory: 2Gi                                         │
│  │   └─ Concurrency: 40                                     │
│  │                                                           │
│  ├─ api-gateway                                             │
│  │   ├─ Min instances: 2                                    │
│  │   ├─ Max instances: 200                                  │
│  │   ├─ CPU: 1                                              │
│  │   ├─ Memory: 512Mi                                       │
│  │   └─ Concurrency: 100                                    │
│  │                                                           │
│  ├─ skillup-bff                                             │
│  │   ├─ Min instances: 1                                    │
│  │   ├─ Max instances: 100                                  │
│  │   ├─ CPU: 1                                              │
│  │   ├─ Memory: 1Gi                                         │
│  │   └─ Concurrency: 80                                     │
│  │                                                           │
│  └─ rth-bff                                                 │
│      ├─ Min instances: 1                                    │
│      ├─ Max instances: 100                                  │
│      ├─ CPU: 1                                              │
│      ├─ Memory: 1Gi                                         │
│      └─ Concurrency: 80                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### **3.2 Cloud Run Configuration**

```yaml
# identity-service.yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: identity-service
  namespace: production
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/minScale: "1"
        autoscaling.knative.dev/maxScale: "100"
        run.googleapis.com/cpu-throttling: "false"
    spec:
      containerConcurrency: 80
      timeoutSeconds: 300
      containers:
      - image: gcr.io/project-id/identity-service:latest
        ports:
        - containerPort: 8080
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: identity-db-url
              key: url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: jwt-secret
              key: secret
        resources:
          limits:
            cpu: "1"
            memory: "512Mi"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
```

### **3.3 Dockerfile Best Practices**

```dockerfile
# Multi-stage build for smaller images
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY turbo.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --production && npm cache clean --force

# Copy built application
COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "dist/index.js"]
```

---

## **4. CI/CD PIPELINE**

### **4.1 GitHub Actions Workflow**

```yaml
# .github/workflows/deploy-identity-service.yml
name: Deploy Identity Service

on:
  push:
    branches:
      - main
    paths:
      - 'services/identity/**'
      - '.github/workflows/deploy-identity-service.yml'

env:
  PROJECT_ID: your-gcp-project-id
  REGION: asia-southeast1
  SERVICE_NAME: identity-service

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run type check
        run: npm run type-check
      
      - name: Run tests
        run: npm run test
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}
      
      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2
      
      - name: Configure Docker
        run: gcloud auth configure-docker
      
      - name: Build Docker image
        run: |
          docker build \
            -t gcr.io/$PROJECT_ID/$SERVICE_NAME:$GITHUB_SHA \
            -t gcr.io/$PROJECT_ID/$SERVICE_NAME:latest \
            -f services/identity/Dockerfile \
            .
      
      - name: Scan image for vulnerabilities
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: gcr.io/$PROJECT_ID/$SERVICE_NAME:$GITHUB_SHA
          format: 'sarif'
          output: 'trivy-results.sarif'
      
      - name: Push Docker image
        run: |
          docker push gcr.io/$PROJECT_ID/$SERVICE_NAME:$GITHUB_SHA
          docker push gcr.io/$PROJECT_ID/$SERVICE_NAME:latest

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4
      
      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}
      
      - name: Deploy to Cloud Run (Staging)
        run: |
          gcloud run deploy $SERVICE_NAME-staging \
            --image gcr.io/$PROJECT_ID/$SERVICE_NAME:$GITHUB_SHA \
            --region $REGION \
            --platform managed \
            --allow-unauthenticated \
            --min-instances 0 \
            --max-instances 10 \
            --memory 512Mi \
            --cpu 1 \
            --concurrency 80 \
            --timeout 300 \
            --set-env-vars "NODE_ENV=staging" \
            --set-secrets "DATABASE_URL=identity-db-url-staging:latest,JWT_SECRET=jwt-secret:latest"
      
      - name: Run smoke tests
        run: |
          SERVICE_URL=$(gcloud run services describe $SERVICE_NAME-staging --region $REGION --format 'value(status.url)')
          npm run test:smoke -- --url $SERVICE_URL

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      
      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}
      
      - name: Deploy to Cloud Run (Production)
        run: |
          gcloud run deploy $SERVICE_NAME \
            --image gcr.io/$PROJECT_ID/$SERVICE_NAME:$GITHUB_SHA \
            --region $REGION \
            --platform managed \
            --allow-unauthenticated \
            --min-instances 1 \
            --max-instances 100 \
            --memory 512Mi \
            --cpu 1 \
            --concurrency 80 \
            --timeout 300 \
            --set-env-vars "NODE_ENV=production" \
            --set-secrets "DATABASE_URL=identity-db-url:latest,JWT_SECRET=jwt-secret:latest" \
            --no-traffic
      
      - name: Route 10% traffic to new revision
        run: |
          REVISION=$(gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.latestCreatedRevisionName)')
          gcloud run services update-traffic $SERVICE_NAME \
            --region $REGION \
            --to-revisions $REVISION=10
      
      - name: Wait and monitor
        run: sleep 300
      
      - name: Check error rate
        run: |
          # Check Cloud Monitoring for error rate
          # If error rate > 1%, rollback
          ERROR_RATE=$(gcloud monitoring time-series list \
            --filter "metric.type=\"run.googleapis.com/request_count\" AND resource.labels.service_name=\"$SERVICE_NAME\"" \
            --format json | jq '.[] | select(.metric.labels.response_code_class="5xx") | .points[0].value.int64Value')
          
          if [ "$ERROR_RATE" -gt 10 ]; then
            echo "Error rate too high, rolling back"
            exit 1
          fi
      
      - name: Route 100% traffic to new revision
        run: |
          REVISION=$(gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.latestCreatedRevisionName)')
          gcloud run services update-traffic $SERVICE_NAME \
            --region $REGION \
            --to-revisions $REVISION=100
      
      - name: Notify team
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Identity Service deployed to production'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### **4.2 Pipeline Stages**

```
┌─────────────────────────────────────────────────────────────┐
│ CI/CD PIPELINE STAGES                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Code Push                                               │
│     └─ Developer pushes to main branch                      │
│                                                             │
│  2. Test Stage (5-10 minutes)                               │
│     ├─ Lint code                                            │
│     ├─ Type check                                           │
│     ├─ Unit tests                                           │
│     └─ Integration tests                                    │
│                                                             │
│  3. Build Stage (5-10 minutes)                              │
│     ├─ Build Docker image                                   │
│     ├─ Scan for vulnerabilities                             │
│     └─ Push to Artifact Registry                            │
│                                                             │
│  4. Deploy Staging (2-5 minutes)                            │
│     ├─ Deploy to staging environment                        │
│     ├─ Run smoke tests                                      │
│     └─ Wait for approval                                    │
│                                                             │
│  5. Deploy Production (10-20 minutes)                       │
│     ├─ Deploy new revision (no traffic)                     │
│     ├─ Route 10% traffic (canary)                           │
│     ├─ Monitor for 5 minutes                                │
│     ├─ Check error rate                                     │
│     └─ Route 100% traffic                                   │
│                                                             │
│  Total Time: 22-45 minutes                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## **5. DEPLOYMENT PATTERNS**

### **5.1 Blue-Green Deployment**

```
┌─────────────────────────────────────────────────────────────┐
│ BLUE-GREEN DEPLOYMENT                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Step 1: Current State                                      │
│  ├─ Blue (v1.0) ← 100% traffic                              │
│  └─ Green (none)                                            │
│                                                             │
│  Step 2: Deploy New Version                                 │
│  ├─ Blue (v1.0) ← 100% traffic                              │
│  └─ Green (v1.1) ← 0% traffic (deployed, not serving)       │
│                                                             │
│  Step 3: Switch Traffic                                     │
│  ├─ Blue (v1.0) ← 0% traffic                                │
│  └─ Green (v1.1) ← 100% traffic                             │
│                                                             │
│  Step 4: Rollback (if needed)                               │
│  ├─ Blue (v1.0) ← 100% traffic (instant rollback)           │
│  └─ Green (v1.1) ← 0% traffic                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Implementation**:

```bash
# Deploy new version (green) with no traffic
gcloud run deploy identity-service \
  --image gcr.io/project-id/identity-service:v1.1 \
  --region asia-southeast1 \
  --no-traffic \
  --tag green

# Test green version
curl https://green---identity-service-xxx.run.app/health

# Switch 100% traffic to green
gcloud run services update-traffic identity-service \
  --region asia-southeast1 \
  --to-tags green=100

# Rollback to blue if needed
gcloud run services update-traffic identity-service \
  --region asia-southeast1 \
  --to-revisions identity-service-v1-0=100
```

### **5.2 Canary Deployment**

```
┌─────────────────────────────────────────────────────────────┐
│ CANARY DEPLOYMENT                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Step 1: Deploy Canary                                      │
│  ├─ Stable (v1.0) ← 100% traffic                            │
│  └─ Canary (v1.1) ← 0% traffic                              │
│                                                             │
│  Step 2: Route 10% to Canary                                │
│  ├─ Stable (v1.0) ← 90% traffic                             │
│  └─ Canary (v1.1) ← 10% traffic                             │
│                                                             │
│  Step 3: Monitor (5-10 minutes)                             │
│  ├─ Check error rate                                        │
│  ├─ Check latency                                           │
│  └─ Check business metrics                                  │
│                                                             │
│  Step 4: Gradually Increase                                 │
│  ├─ 10% → 25% → 50% → 75% → 100%                            │
│  └─ Monitor at each step                                    │
│                                                             │
│  Step 5: Rollback (if issues detected)                      │
│  ├─ Stable (v1.0) ← 100% traffic                            │
│  └─ Canary (v1.1) ← 0% traffic                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Implementation**:

```bash
# Deploy canary with no traffic
gcloud run deploy identity-service \
  --image gcr.io/project-id/identity-service:v1.1 \
  --region asia-southeast1 \
  --no-traffic \
  --tag canary

# Route 10% traffic to canary
CANARY_REVISION=$(gcloud run services describe identity-service --region asia-southeast1 --format 'value(status.latestCreatedRevisionName)')
STABLE_REVISION=$(gcloud run services describe identity-service --region asia-southeast1 --format 'value(status.traffic[0].revisionName)')

gcloud run services update-traffic identity-service \
  --region asia-southeast1 \
  --to-revisions $STABLE_REVISION=90,$CANARY_REVISION=10

# Monitor for 5 minutes
sleep 300

# Check metrics
gcloud monitoring time-series list \
  --filter "metric.type=\"run.googleapis.com/request_count\" AND resource.labels.service_name=\"identity-service\""

# If all good, increase to 25%
gcloud run services update-traffic identity-service \
  --region asia-southeast1 \
  --to-revisions $STABLE_REVISION=75,$CANARY_REVISION=25

# Continue until 100%
gcloud run services update-traffic identity-service \
  --region asia-southeast1 \
  --to-revisions $CANARY_REVISION=100
```

### **5.3 Rolling Deployment**

Cloud Run handles rolling deployments automatically:

```bash
# Deploy new version
gcloud run deploy identity-service \
  --image gcr.io/project-id/identity-service:v1.1 \
  --region asia-southeast1

# Cloud Run automatically:
# 1. Creates new revision
# 2. Starts routing traffic to new revision
# 3. Gradually scales down old revision
# 4. Keeps old revision for rollback
```

---

## **6. ROLLBACK STRATEGIES**

### **6.1 Instant Rollback**

```bash
# List revisions
gcloud run revisions list \
  --service identity-service \
  --region asia-southeast1

# Rollback to previous revision
gcloud run services update-traffic identity-service \
  --region asia-southeast1 \
  --to-revisions identity-service-v1-0=100
```

### **6.2 Automated Rollback**

```yaml
# Automated rollback based on error rate
- name: Monitor and rollback if needed
  run: |
    # Get current and previous revisions
    CURRENT=$(gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.latestCreatedRevisionName)')
    PREVIOUS=$(gcloud run revisions list --service $SERVICE_NAME --region $REGION --limit 2 --format 'value(metadata.name)' | tail -n 1)
    
    # Monitor for 5 minutes
    for i in {1..10}; do
      # Check error rate
      ERROR_RATE=$(gcloud monitoring time-series list \
        --filter "metric.type=\"run.googleapis.com/request_count\" AND resource.labels.service_name=\"$SERVICE_NAME\" AND metric.labels.response_code_class=\"5xx\"" \
        --format json | jq '.[] | .points[0].value.int64Value')
      
      # If error rate > 1%, rollback
      if [ "$ERROR_RATE" -gt 10 ]; then
        echo "Error rate too high ($ERROR_RATE errors), rolling back to $PREVIOUS"
        gcloud run services update-traffic $SERVICE_NAME \
          --region $REGION \
          --to-revisions $PREVIOUS=100
        exit 1
      fi
      
      sleep 30
    done
```

---

## **7. ENVIRONMENT MANAGEMENT**

### **7.1 Environment Strategy**

```
┌─────────────────────────────────────────────────────────────┐
│ ENVIRONMENTS                                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Development                                                │
│  ├─ Local development                                       │
│  ├─ Docker Compose                                          │
│  └─ Local databases                                         │
│                                                             │
│  Staging                                                    │
│  ├─ Cloud Run (asia-southeast1)                             │
│  ├─ Neon databases (staging)                                │
│  ├─ Cloudflare Worker (staging)                             │
│  └─ Automated deployments from main                         │
│                                                             │
│  Production                                                 │
│  ├─ Cloud Run (asia-southeast1)                             │
│  ├─ Neon databases (production)                             │
│  ├─ Cloudflare Worker (production)                          │
│  └─ Manual approval required                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### **7.2 Environment Configuration**

```typescript
// config/environments.ts
export const environments = {
  development: {
    apiGateway: 'http://localhost:8080',
    identityService: 'http://localhost:8081',
    tutorialService: 'http://localhost:8082',
    examService: 'http://localhost:8083',
    database: {
      host: 'localhost',
      port: 5432,
      ssl: false
    },
    redis: {
      host: 'localhost',
      port: 6379
    }
  },
  
  staging: {
    apiGateway: 'https://api-gateway-staging-xxx.run.app',
    identityService: 'https://identity-service-staging-xxx.run.app',
    tutorialService: 'https://tutorial-service-staging-xxx.run.app',
    examService: 'https://exam-service-staging-xxx.run.app',
    database: {
      host: 'staging-db.neon.tech',
      port: 5432,
      ssl: true
    },
    redis: {
      host: 'staging-redis.xxx.cloud.redislabs.com',
      port: 6379
    }
  },
  
  production: {
    apiGateway: 'https://api.skillup.com',
    identityService: 'https://identity-service-xxx.run.app',
    tutorialService: 'https://tutorial-service-xxx.run.app',
    examService: 'https://exam-service-xxx.run.app',
    database: {
      host: 'prod-db.neon.tech',
      port: 5432,
      ssl: true
    },
    redis: {
      host: 'prod-redis.xxx.cloud.redislabs.com',
      port: 6379
    }
  }
};
```

---

## **8. SECRETS MANAGEMENT**

### **8.1 Google Secret Manager**

```bash
# Create secret
gcloud secrets create jwt-secret \
  --replication-policy="automatic" \
  --data-file=jwt-secret.txt

# Grant access to Cloud Run service account
gcloud secrets add-iam-policy-binding jwt-secret \
  --member="serviceAccount:identity-service@project-id.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Use secret in Cloud Run
gcloud run deploy identity-service \
  --set-secrets "JWT_SECRET=jwt-secret:latest"
```

### **8.2 Secret Rotation**

```bash
# Add new version
echo "new-secret-value" | gcloud secrets versions add jwt-secret --data-file=-

# Update Cloud Run to use new version
gcloud run services update identity-service \
  --update-secrets "JWT_SECRET=jwt-secret:latest"

# Disable old version
gcloud secrets versions disable 1 --secret jwt-secret
```

---

## **9. MONITORING AND HEALTH CHECKS**

### **9.1 Health Check Endpoints**

```typescript
// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.VERSION
  });
});

// Readiness check endpoint
app.get('/ready', async (req, res) => {
  try {
    // Check database connection
    await db.raw('SELECT 1');
    
    // Check Redis connection
    await redis.ping();
    
    res.status(200).json({
      status: 'ready',
      checks: {
        database: 'ok',
        redis: 'ok'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      error: error.message
    });
  }
});
```

### **9.2 Uptime Checks**

```bash
# Create uptime check
gcloud monitoring uptime create identity-service-uptime \
  --resource-type=uptime-url \
  --host=identity-service-xxx.run.app \
  --path=/health \
  --check-interval=60s \
  --timeout=10s
```

---

## **10. SUMMARY**

### **10.1 Key Takeaways**

✅ **Cloud Run for Simplicity**
- Fully managed, no cluster management
- Automatic scaling (0 to 1000 instances)
- Pay per request, cost-effective

✅ **Automated CI/CD**
- GitHub Actions for automation
- Test → Build → Deploy pipeline
- Staging → Production promotion

✅ **Safe Deployment Patterns**
- Blue-Green for instant rollback
- Canary for gradual rollout
- Automated rollback on errors

✅ **Environment Management**
- Development, Staging, Production
- Secret Manager for sensitive data
- Environment-specific configuration

### **10.2 Implementation Checklist**

- [ ] Set up Cloud Run services
- [ ] Configure GitHub Actions workflows
- [ ] Implement health check endpoints
- [ ] Set up Secret Manager
- [ ] Configure uptime checks
- [ ] Test deployment pipeline
- [ ] Test rollback procedures
- [ ] Document deployment process

---

**Next Document**: 09-OBSERVABILITY.md (Monitoring, logging, tracing, alerting)

