# AI Implementation Prompt: Scaling Phase 2 (Async Decoupling)

**Objective**: Transition the "Submit Exam" flow from a synchronous blocking call to an asynchronous, queue-based architecture to support 250k+ users.

---

## CONTEXT
High traffic causes "Submit Exam" requests to time out or exceed DB connection limits. We need to decouple the "Receive" action from the "Process" action.

## INSTRUCTIONS
Please execute the following technical changes:

1. **Queue Infrastructure**:
   - Set up an integration for **Upstash QStash** (or suggest an alternative like Amazon SQS).
   - Create a new utility for pushing messages to the queue.

2. **Refactor Submission API**:
   - Modify the `SUBMIT_EXAM` endpoint.
   - Instead of calling the database logic directly, validate the payload and then "Fire and Forget" the data into the Message Queue.
   - Return a `202 Accepted` response with a `submissionTrackingId`.

3. **Worker Implementation**:
   - Create a new internal API route `/api/workers/process-submission`.
   - This route should be protected (only callable by the Queue service).
   - Implement the logic to take the queue payload and perform the actual Database write.

4. **Reliability Logic**:
   - Implement an **Idempotency Check** in the worker to ensure duplicate messages don't create duplicate records.
   - Add a "Retry Logic" header to handle temporary DB locks gracefully.

## OUTPUT
Provide the updated `route.ts` for the submission API and the code for the new worker function.
