# Operational Manual: Performance & Concurrency Testing
*Mathematics of the Million-User Engine*

## 📜 Objective
To provide a repeatable, rigorous, and automated way to verify that the Quiz Platform can handle **millions of concurrent requests** with zero downtime or data loss.

## 🛠️ Tooling
We use **k6** (by Grafana) for load testing. It is a modern, high-performance tool that allows us to write tests in JavaScript.

### Installation
```bash
# Windows (Choco)
choco install k6

# macOS (Homebrew)
brew install k6
```

---

## 🚀 The Test Suite: `heavy-load.js`
This script is located in `/performance-testing/` and simulates the most critical journey in the platform:

1.  **Launch Jitter**: Tests if the random 0-2s delay correctly flattens the initial surge.
2.  **SyncManager Ghosting**: Fires thousands of small "autosave" background requests to test the Redis state layer.
3.  **Asynchronous Submission**: Verifies that the QStash queue accepts submissions instantly even when under pressure.
4.  **Result Polling**: Checks if analytics are processed correctly in the background.

---

## 📊 Test Stages
The script is configured with 5 distinct phases to safely test the "Breaking Point":

| Stage | Name | Target VUs | Purpose |
| :--- | :--- | :--- | :--- |
| **1** | Smoke Test | 100 | Verify system logic is correct. |
| **2** | Capacity Load | 1,000 | Standard expected daily peak. |
| **3** | Stress Test | 5,000 | Testing the hardware limits. |
| **4** | **Critical Surge** | 10,000 | Extreme spike simulation. |
| **5** | Recovery | 0 | Verify system cleans up resources. |

---

## 🏃 How to Run the Tests

### 1. Local/Staging Test
```bash
k6 run -e TARGET_URL=http://localhost:3000 performance-testing/heavy-load.js
```

### 2. Full-Scale Cloud Test (Requires k6 Cloud)
To simulate true millions, you should run the test from multiple global locations:
```bash
k6 cloud performance-testing/heavy-load.js
```

---

## 🔍 Understanding the Results
Pay attention to these "Golden Signals":

-   **`http_req_duration (p95)`**: 95% of your students should see responses faster than 400ms. If this climbs above 800ms, you need to increase your **Neon Database Compute Units**.
-   **`http_req_failed`**: This must remain **< 1%**. Anything higher indicates that the **Vercel Rate Limits** or the **Upstash QStash** limits have been reached.
-   **`vus` (Virtual Users)**: The number of active "Students" at one time.

---

## ⚠️ Safety Warning: THE "BUST" POINT
Running the **Critical Surge** (Stage 4) against a **Free Tier** Vercel project WILL trigger a temporary suspension of your account for "Excessive Usage." 

**Only run Full-Scale Cloud tests on Paid/Pro environments.**

## 🏁 Certification
Passing a 10,000 VU Stress Test with < 1% error rate qualifies the system as **Hyper-Scale Certified**. 🥂🚀🛡️
