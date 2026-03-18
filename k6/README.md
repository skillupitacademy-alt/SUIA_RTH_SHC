# k6 Load Flows

This folder contains two k6 scripts for the Cloud Run deployment.

## Scripts

- `exam-flow.js` simulates a full exam session:
  - login
  - start exam
  - answer questions
  - submit exam
  - poll report status
- `auth-flow.js` validates auth behavior:
  - successful login
  - invalid password returns `401`
  - lockout account eventually returns `423`

## Environment

Use the direct Cloud Run API URL only:

```bash
API_URL=https://quiz-api-server-581488566988.asia-south1.run.app
```

Required env vars:

- `TEST_EMAIL` defaults to `k6-test@loadtest.example.com`
- `TEST_PASSWORD`
- `LOCKOUT_EMAIL` defaults to `k6-lockout@loadtest.example.com`
- `DOMAIN_ID`
- `DIFFICULTY` defaults to `simple`
- `QUESTION_COUNT` defaults to `10`
- `STAGE_PROFILE` defaults to `mini`

## Stage Profiles

- `mini`: 3 VUs for 1 minute
- `load`: 50 VUs for 5 minutes
- `stress`: 100 VUs for 10 minutes
- `spike`: 200 VUs for 2 minutes

## Run Locally

```bash
k6 run k6/exam-flow.js
k6 run k6/auth-flow.js
```

With env vars:

```bash
API_URL=https://quiz-api-server-581488566988.asia-south1.run.app \
TEST_PASSWORD='your-password' \
DOMAIN_ID='your-domain-id' \
QUESTION_COUNT=10 \
STAGE_PROFILE=mini \
k6 run k6/exam-flow.js
```

```bash
API_URL=https://quiz-api-server-581488566988.asia-south1.run.app \
TEST_PASSWORD='your-password' \
LOCKOUT_EMAIL='k6-lockout@loadtest.example.com' \
STAGE_PROFILE=mini \
k6 run k6/auth-flow.js
```

## CI

The root `package.json` includes:

- `pnpm k6:exam`
- `pnpm k6:auth`

These assume `k6` is installed in the execution environment.

