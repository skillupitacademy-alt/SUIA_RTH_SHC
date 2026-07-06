# Cloud Run Rightsizing Audit (2026-07-03)

| Service | Region | Cur CPU | Cur Mem | Max CPU (7d) | Max Mem (7d) | Recommended CPU | Recommended Mem |
|---|---|---|---|---|---|---|---|
| faculty-app | asia-south1 | 1000m | 512Mi | 0.0% | 0.0% (0MB) | 1 | 256Mi |
| faculty-app | asia-southeast1 | 1000m | 512Mi | 0.0% | 0.0% (0MB) | 1 | 256Mi |
| quiz-admin-app | asia-south1 | 1 | 1Gi | 35.0% | 14.0% (143MB) | 1 | 256Mi |
| quiz-admin-app | asia-southeast1 | 1 | 1Gi | 35.0% | 14.0% (143MB) | 1 | 256Mi |
| quiz-api-server | asia-southeast1 | 2 | 2Gi | 21.0% | 8.0% (164MB) | 1 | 512Mi |
| quiz-web-app | asia-south1 | 1 | 1Gi | 4.0% | 10.0% (102MB) | 1 | 256Mi |
| quiz-web-app | asia-southeast1 | 1 | 1Gi | 4.0% | 10.0% (102MB) | 1 | 256Mi |
| realtutorialhub-site | asia-south1 | 1000m | 512Mi | 12.0% | 20.0% (102MB) | 1 | 256Mi |
| realtutorialhub-web | asia-southeast1 | 2 | 2Gi | 14.0% | 7.0% (143MB) | 1 | 256Mi |
| skillhub-placement | asia-south1 | 1000m | 512Mi | 6.0% | 21.0% (107MB) | 1 | 256Mi |
| skillhub-placement | asia-southeast1 | 1000m | 512Mi | 6.0% | 21.0% (107MB) | 1 | 256Mi |
| skillhubcore-admin | asia-south1 | 1000m | 512Mi | 40.0% | 14.0% (72MB) | 1 | 256Mi |
| skillhubcore-admin | asia-southeast1 | 1 | 1Gi | 40.0% | 14.0% (143MB) | 1 | 256Mi |
| skillhubcore-service | asia-south1 | 1000m | 512Mi | 12.0% | 34.0% (174MB) | 1 | 512Mi |
| skillhubcore-service | asia-southeast1 | 1000m | 512Mi | 12.0% | 34.0% (174MB) | 1 | 512Mi |
| skillup-admin | asia-south1 | 1000m | 512Mi | 15.0% | 21.0% (107MB) | 1 | 256Mi |
| skillup-admin | asia-southeast1 | 1000m | 512Mi | 15.0% | 21.0% (107MB) | 1 | 256Mi |
| skillup-web | asia-southeast1 | 1000m | 512Mi | 38.0% | 27.0% (138MB) | 1 | 256Mi |
| skillupitacademy-site | asia-south1 | 1000m | 512Mi | 7.0% | 21.0% (107MB) | 1 | 256Mi |