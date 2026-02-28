# Hyper-Scale Environment Variable Guide (Production)

This guide documents every environment variable required to support the **Planetary Scale** architecture discussed in Phases 1-14.

## 🏗️ 1. Core Infrastructure (Critical)
| Variable | Description | Recommended Value |
| :--- | :--- | :--- |
| `DATABASE_URL` | Primary Neon Connection String. **MUST** use the pooler. | `postgres://user:pass@ep-pooler.neon.tech/neondb` |
| `DATABASE_URL_REPLICA`| Neon Read-Replica for heavy analytics. | `postgres://user:pass@ep-replica.neon.tech/neondb` |
| `JWT_SECRET` | Master secret for user access tokens. | *Long Random Hash* |
| `JWT_REFRESH_SECRET` | Secret for refreshing sessions. | *Long Random Hash* |
| `ADMIN_JWT_SECRET` | Specialized secret for Admin Core access. | *Long Random Hash* |
| `NEXT_PUBLIC_APP_URL` | Your live production domain. | `https://your-app.vercel.app` |

---

## 🛡️ 2. Resilience & Circuit Breakers (Safe Mode)
| Variable | Description | Default |
| :--- | :--- | :--- |
| `SAFE_MODE` | Global kill-switch. When `true`, sheds all non-critical load. | `false` |
| `DISABLE_ANALYTICS` | Disables heavy analytics queries specifically. | `false` |
| `DISABLE_AI_TUTOR` | Bypasses AI processing and recommendations. | `false` |
| `DISABLE_REPORT_GEN` | Pauses expensive PDF generation background workers. | `false` |
| `DISABLE_NOTIFICATIONS`| Pauses secondary automated emails/push alerts. | `false` |

---

## 🧠 3. Intelligence & Cache (Upstash)
| Variable | Description |
| :--- | :--- |
| `UPSTASH_REDIS_REST_URL`  | Redis endpoint for rate limiting and fast caching. |
| `UPSTASH_REDIS_REST_TOKEN`| Redis authorization token. |
| `UPSTASH_VECTOR_REST_URL` | Vector DB for semantic AI tutoring. |
| `UPSTASH_VECTOR_REST_TOKEN`| Vector DB authorization token. |

---

## 📮 4. Operations & Workers (QStash)
| Variable | Description | Recommended Setting |
| :--- | :--- | :--- |
| `QSTASH_TOKEN` | Auth for asynchronous background jobs. | *Upstash Dashboard* |
| `QSTASH_URL` | Base publish URL for QStash. | `https://qstash.upstash.io/v2/publish/` |
| `RESEND_API_KEY` | API Key for transactional student emails. | *Resend Dashboard* |
| `CLOUDFLARE_R2_ACCESS_KEY`| Access for cold-storage (Phase 11). | *CF Dash* |

---

## 🌍 5. Global Scaling (Vercel/Cloudflare)
*Note: These are usually managed in the Cloudflare/Vercel Dashboards, not as code ENV variables.*
- **Vercel Regions**: `sin1` (Singapore), `bom1` (Mumbai), `lhr1` (London).
- **Edge Runtime**: Ensure `export const runtime = 'edge'` is in critical API routes.

---

## 🦾 6. Operational Alerting & Financials (Phases 12-13)
| Variable | Description | Recommended Value |
| :--- | :--- | :--- |
| `OPERATIONAL_SLACK_WEBHOOK`| URL for Slack/Discord performance alerts. | `https://hooks.slack.com/...` |
| `BUDGET_THRESHOLD_USD` | Monthly spend ceiling. Triggers Safe Mode at 90%. | `500` |
| `CLOUDFLARE_ZONE_ID` | Required for WAF automation. | *CF Dashboard* |
| `CLOUDFLARE_API_TOKEN` | Required for WAF automation. | *CF Dashboard* |

---

## 📋 Vercel Bulk Add Script
You can copy this into a temporary `.env.production` file to bulk-import into Vercel via CLI:
```bash
DATABASE_URL=""
DATABASE_URL_REPLICA=""
JWT_SECRET=""
JWT_REFRESH_SECRET=""
ADMIN_JWT_SECRET=""
NEXT_PUBLIC_APP_URL=""
SAFE_MODE="false"
DISABLE_ANALYTICS="false"
DISABLE_AI_TUTOR="false"
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""
UPSTASH_VECTOR_REST_URL=""
UPSTASH_VECTOR_REST_TOKEN=""
QSTASH_TOKEN=""
OPERATIONAL_SLACK_WEBHOOK=""
BUDGET_THRESHOLD_USD="500"
```

*Document Version: 4.1 (Full Hyper-Scale Operational)*
