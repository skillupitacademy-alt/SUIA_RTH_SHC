# FND23 assignment help producer isolated control manifest

Baseline 36c69d6b. Actual AssignmentService persists a help request then fires an unregistered event and suppresses failure. Add only isolated real-service controls with injected repository and mocked publisher: valid assignment persists and returns despite publisher failure, foreign assignment denies before any write or publish. This documents current semantics without declaring durable delivery or changing tenant authority. No physical DB/queue/browser, pre-import network guard. Sol review required.
