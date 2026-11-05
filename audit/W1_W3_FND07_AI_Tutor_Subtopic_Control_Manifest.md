# FND07 RTH AI tutor subtopic propagation control manifest

Baseline 9920e273. TutorialExperience passes subtopicId to BlockRenderer, but BlockRenderer does not pass it to AITutorBlock, which defaults to a fixed UUID. Add isolated mounted actual BlockRenderer control with mocked child to assert actual parent-supplied ID reaches AI tutor. Retain failing assertion; this is legacy consumer compatibility evidence, not authorization to develop legacy content or assume ID mapping. No production change, network/DB/browser; guarded config-free runner. Sol review required.
