# k6 Baselines

These are the acceptance thresholds for the load-test flows.

## Thresholds

- `exam-flow`
  - `http_req_duration p95 < 3000ms`
  - `http_req_failed < 1%`
- `auth-flow`
  - `http_req_duration p95 < 1000ms`
  - `http_req_failed < 0.5%`
- `admin-flow`
  - `http_req_duration p95 < 2000ms`
  - `http_req_failed < 1%`

The same thresholds are encoded in each k6 script.

## Neon Launch Capacity

- Max connections: 25
- Recommended max VUs for the `mini` profile: 3
- Upgrade to Neon Scale if `p95 > 5000ms` consistently

## Notes

- `stress` and `spike` profiles are deferred until Neon Scale is in place.
- Use the direct GCP Cloud Run URLs for all load-test traffic.
