# PDF Generation Pipeline Environment Variables

The following environment variables must be configured in the production environment (Vercel) and local `.env` files for the PDF pipeline to function correctly.

## Core Infrastructure
| Variable | Description | Source/Value |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_WEB_APP_URL` | Base URL of the Web App for Puppeteer to navigate to (used by both server and client). | e.g., `https://quiz.skillhubcore.in` |
| `NEXT_PUBLIC_API_URL` | Public API URL for the Web App to fetch report data. | e.g., `https://api.realtutorialhub.com` |
| `INTERNAL_API_KEY` | Secret key for service-to-service communication. | Any secure random string. |

## Storage Settings
| Variable | Description | Value |
| :--- | :--- | :--- |
| `STORAGE_PROVIDER` | Toggle between storage backends. | `blob` (Vercel) or `r2` (Cloudflare) |
| `BLOB_READ_WRITE_TOKEN` | Token for Vercel Blob storage. | Vercel Dashboard -> Storage -> Blob |

### Cloudflare R2 (If `STORAGE_PROVIDER=r2`)
| Variable | Value |
| :--- | :--- |
| `R2_ENDPOINT` | `<id>.r2.cloudflarestorage.com` |
| `R2_ACCESS_KEY_ID` | R2 API Token Key |
| `R2_SECRET_ACCESS_KEY` | R2 API Token Secret |
| `R2_BUCKET` | Name of the R2 bucket |

## Concurrency & Redis
| Variable | Description |
| :--- | :--- |
| `UPSTASH_REDIS_REST_URL` | Redis URL for locking and rate limiting. |
| `UPSTASH_REDIS_REST_TOKEN` | Redis Token for authentication. |

---

## Security Protocol
1. **Signed URLs**: When using R2, the system automatically generates temporary signed URLs for report downloads.
2. **Rate Limiting**: The `/api/generate-report` endpoint is limited to 3 generations per minute per user via Redis.
3. **Locking**: A Redis lock (`lock:pdf:[attemptId]`) is used to prevent duplicate generation runs for the same attempt.
