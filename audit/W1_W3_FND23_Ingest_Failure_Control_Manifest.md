# FND23 marketing ingest failure sensitivity manifest

Baseline 4f3380eb. Actual ingest pipeline records an in-memory dedupe marker before dispatch and catches provider failures into an in-memory dead letter, then returns accepted. Add offline actual-pipeline control with isolated config, intercepted provider transport and mocked internal publisher. Record observable first failure and retry; do not assert accepted means durable delivery without selected contract. No production edits/network/queue/store. Sol review required.
