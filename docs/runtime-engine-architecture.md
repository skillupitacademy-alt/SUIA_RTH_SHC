# Runtime Engine Architecture

## Overview
The Runtime Engine Layer orchestrates the live behavior of the platform, managing the transition from static content models to interactive user sessions.

## Runtime Flow Diagram
```mermaid
graph TD
    User((User)) -->|POST /quiz/start| QE[Quiz Engine]
    QE -->|Instantiates| EE[Exam Engine]
    EE -->|Requests Questions| QDE[Question Delivery Engine]
    EE -->|Serves Question| User
    User -->|POST /quiz/answer| AE[Answer Evaluation Engine]
    AE -->|Persists State| DB[(Neon Postgres)]
    User -->|POST /quiz/submit| SE[Scoring Engine]
    SE -->|Calculates Results| RE[Report Engine]
    RE -->|Updates| DE[Dashboard Engine]
    DE -->|Visualizes| User
```

## Session Lifecycle Diagram
```mermaid
stateDiagram-v2
    [*] --> Started: startQuiz()
    Started --> QuestionServed: nextQuestion()
    QuestionServed --> Answered: submitAnswer()
    Answered --> QuestionServed: nextQuestion()
    Answered --> Completed: completeExam() (Manual/Auto)
    Completed --> ResultGenerated: calculateResults()
    ResultGenerated --> [*]
```

## Internal Engines
- **Quiz Engine**: Lifecycle & State management.
- **Exam Engine**: Session timing & submission flow.
- **Question Delivery**: Streaming & Randomization.
- **Answer Evaluation**: Content-aware correctness check.
- **Scoring Engine**: Multi-dimensional point calculation.
- **Report Engine**: Mastery & Progress analysis.
- **Admin Engine**: Publishing & Approval workflows.
