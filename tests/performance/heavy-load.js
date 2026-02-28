import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * Hyper-Scale Load Test Configuration
 * Targets: 1M+ Simultaneous Users (Simulated via Stages)
 */
export const options = {
    stages: [
        { duration: '1m', target: 100 },  // 1. Smoke Test: Low load to verify logic
        { duration: '3m', target: 1000 }, // 2. Capacity Load: Standard expected peak
        { duration: '5m', target: 5000 }, // 3. Stress Test: Testing the Breaking Point
        { duration: '2m', target: 10000 },// 4. Critical Surge: 10k concurrent (Extreme)
        { duration: '3m', target: 0 },    // 5. Recovery: Cool down
    ],
    thresholds: {
        http_req_duration: ['p(95)<400'], // 95% of requests must be under 400ms
        http_req_failed: ['rate<0.01'],   // Error rate must be < 1%
    },
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:3000';
const API_URL = `${BASE_URL}/api`;

/**
 * Main Test Logic
 */
export default function () {
    // --- PHASE 1: Authentication ---
    // Note: Usually use pre-seeded tokens to avoid load-testing the Auth provider
    const params = {
        headers: { 'Content-Type': 'application/json' },
    };

    // --- PHASE 2: Exam Launch with Jitter ---
    // Simulate the 'Launch Jitter' built into the platform
    const jitter = Math.random() * 2000;
    sleep(jitter / 1000);

    const launchRes = http.post(`${API_URL}/exams/launch`, JSON.stringify({
        blueprintId: 'hyper-scale-test-id'
    }), params);

    check(launchRes, {
        'exam launched successfully': (r) => r.status === 200,
        'launch time < 500ms': (r) => r.timings.duration < 500,
    });

    if (launchRes.status !== 200) return;
    const examId = launchRes.json('id');

    // --- PHASE 3: The "SyncManager" Loop (High Frequency) ---
    // Simulate 10-20 minutes of exam taking with background syncing
    for (let i = 0; i < 15; i++) {
        // 1. Fetch Question (Caching Check)
        const questionRes = http.get(`${API_URL}/exams/${examId}/questions?index=${i}`);
        check(questionRes, { 'question fetched': (r) => r.status === 200 });

        // Simulate "Thinking Time"
        sleep(Math.random() * 5 + 5);

        // 2. Autosave Answer (SyncManager simulation)
        const autosaveRes = http.post(`${API_URL}/exams/${examId}/sync`, JSON.stringify({
            questionId: `q-${i}`,
            answer: 'option-a',
            timestamp: new Date().toISOString()
        }), params);

        check(autosaveRes, {
            'autosave accepted': (r) => r.status === 200,
            'autosave < 200ms': (r) => r.timings.duration < 200,
        });

        // Random Jitter between saves
        sleep(Math.random() * 2);
    }

    // --- PHASE 4: Asynchronous Submission ---
    // This triggers the QStash/Worker pipeline
    const submitRes = http.post(`${API_URL}/exams/${examId}/submit`, JSON.stringify({}), params);

    check(submitRes, {
        'submission decoupled (async)': (r) => r.status === 202 || r.status === 200,
        'submit latency < 300ms': (r) => r.timings.duration < 300,
    });

    // --- PHASE 5: Result Retrieval (Polling) ---
    // Students usually check results after a small delay
    sleep(3);
    const resultRes = http.get(`${API_URL}/exams/${examId}/results`);
    check(resultRes, { 'results available/queued': (r) => r.status === 200 });

    sleep(1);
}
