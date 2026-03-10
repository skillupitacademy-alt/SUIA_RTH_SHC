import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * k6 Smoke Test
 * Establishing a baseline for public and system endpoints.
 * Run with: k6 run scripts/load/smoke.js
 */
export const options = {
    vus: 3, // Low virtual users for smoke test
    duration: '15s',
    thresholds: {
        http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
        http_req_failed: ['rate<0.01'],    // Error rate must be less than 1%
    },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3000/api';

export default function () {
    // 1. Health Check
    let healthRes = http.get(`${BASE_URL}/health`);
    check(healthRes, {
        'health status is 200': (r) => r.status === 200,
    });

    // 2. Feature Flags
    let flagsRes = http.get(`${BASE_URL}/system/flags`);
    check(flagsRes, {
        'flags status is 200': (r) => r.status === 200,
        'has flags object': (r) => r.json().hasOwnProperty('flags'),
    });

    // 3. Public Quiz List (Optional check)
    let quizRes = http.get(`${BASE_URL}/quiz`);
    check(quizRes, {
        'quiz list status is 200': (r) => r.status === 200 || r.status === 404, // 404 is acceptable if no quizzes
    });

    sleep(1);
}
