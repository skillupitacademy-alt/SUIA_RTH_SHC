# Phase 2: Asynchronous Decoupling
**Target: 50,000 -> 250,000 Concurrent Users**

This phase moves the platform from a "Synchronous" (wait for completion) model to an "Asynchronous" (process eventually) model to handle high-velocity submission storms.

## 1. Submission Buffering (Message Queues)
The standard API model fails when thousands of users submit at the exact same millisecond. 
*   **Strategy**: Use a serverless-friendly queue like **Upstash QStash** or **Amazon SQS**.
*   **Action**: 
    1.  Student clicks "Submit".
    2.  API validates the payload (quickly).
    3.  API pushes payload to the Queue.
    4.  API returns `202 Accepted` to the student.
*   **Benefits**: The submission never times out, and the user doesn't wait for the DB.

## 2. Background Processing (Workers)
Separate the heavy work from the critical path of the exam.
*   **Strategy**: Event-driven background functions.
*   **Action**: Trigger separate "Worker" functions when a message arrives in the queue. 
    - **Worker A**: Persists raw answers to the Database.
    - **Worker B**: Triggers AI analysis for the "Neural Matrix".
    - **Worker C**: Triggers PDF generation.
*   **Benefits**: If AI or PDF services are slow, they don't block the student from finishing their exam.

## 3. Idempotency Keys (The "At-Least-Once" Safety)
Queues sometimes deliver messages twice.
*   **Strategy**: Header-based Idempotency.
*   **Action**: Generate a `Submission-ID` on the client. Workers check if this ID already exists in the `processed_submissions` table before saving.
*   **Benefits**: Prevents duplicate exam results and double-billing of compute resources.

## 4. Prioritized Throttling
During peak load, give priority to the "Submit" action over "View Dashboard".
*   **Strategy**: Rate Limiting based on route priority.
*   **Action**: Use **Upstash Redis** to implement stricter limits on analytics routes while keeping submission routes open.
*   **Benefits**: Ensures the core purpose of the app (taking exams) remains online even during heavy surges.
