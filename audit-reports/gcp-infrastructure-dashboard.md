# GCP Infrastructure & Cost Dashboard

*Generated on 2026-07-03*

## Cost Summary & Baseline Metrics

This dashboard tracks key resources driving GCP billing, updated via `scripts/gcp_cost_baseline.py`.

### Summary Metrics

| Metric | Baseline (Pre-Opt) | Current State | Target Post-Opt | Status |
|--------|:------------------:|:-------------:|:---------------:|:------:|
| **Monthly Estimate** | ~₹6,800 | **₹6,800** | **₹1,500–₹2,500** | Active |
| **Artifact Registry Images** | 2842 | **2842** | < 80 | Pending Cleanup |
| **Active Secrets / Versions** | 49 / 126 | **49 / 126** | 49 / 49 | Pending Version Cleanup |
| **Cloud Run Revisions** | 1868 | **1868** | < 25 | Pending Revision Cleanup |
| **Avg Build Time (Last 30)** | 0s | **0s** | < 120s (with Cache) | Pending Cache |

---

### Cloud Run Services Sizing Audit

| Service | CPU | Memory | Concurrency | Total Revisions |
|---------|:---:|:------:|:-----------:|:---------------:|
| `faculty-app` | 1000m CPU | 512Mi | Unknown | 56 |
| `faculty-app` | 1000m CPU | 512Mi | Unknown | 56 |
| `quiz-admin-app` | 1 CPU | 1Gi | Unknown | 75 |
| `quiz-admin-app` | 1 CPU | 1Gi | Unknown | 75 |
| `quiz-api-server` | 2 CPU | 2Gi | Unknown | 274 |
| `quiz-web-app` | 1 CPU | 1Gi | Unknown | 73 |
| `quiz-web-app` | 1 CPU | 1Gi | Unknown | 73 |
| `realtutorialhub-site` | 1000m CPU | 512Mi | Unknown | 12 |
| `realtutorialhub-web` | 2 CPU | 2Gi | Unknown | 303 |
| `skillhub-placement` | 1000m CPU | 512Mi | Unknown | 39 |
| `skillhub-placement` | 1000m CPU | 512Mi | Unknown | 39 |
| `skillhubcore-admin` | 1 CPU | 1Gi | Unknown | 149 |
| `skillhubcore-admin` | 1 CPU | 1Gi | Unknown | 149 |
| `skillhubcore-service` | 1000m CPU | 512Mi | Unknown | 39 |
| `skillhubcore-service` | 1000m CPU | 512Mi | Unknown | 39 |
| `skillup-admin` | 1000m CPU | 512Mi | Unknown | 56 |
| `skillup-admin` | 1000m CPU | 512Mi | Unknown | 56 |
| `skillup-web` | 1000m CPU | 512Mi | Unknown | 292 |
| `skillupitacademy-site` | 1000m CPU | 512Mi | Unknown | 13 |

---

### Cloud Build Activity (Last 30 Runs)

- **Total Runs Checked**: 30
- **Success Rate**: 83% (25 success, 5 failed)
- **Average Duration**: 0 seconds

---

### Artifact Registry Breakdown

- **asia-southeast1 (Core Repository)**: 2219 images
- **asia-south1 (Marketing Repository)**: 623 images
- **Total Registered Images / Tags**: 2842

---

### Secret Manager

- **Total Unique Secrets**: 49
- **Total Versions Stored**: 126 (Avg 2 versions per secret)
