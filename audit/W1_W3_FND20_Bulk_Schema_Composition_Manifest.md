# FND20 bulk caller schema composition manifest

Baseline bedb0838. Existing guarded mounted BulkUploadPanel tests stop at mocked API. Extend adjacent test to pass its actual emitted payload into the actual central `bulkQuestionSchema` with a disposable valid topic UUID, checking supported text aliases and malformed-input zero dispatch. This is in-process schema composition, not HTTP, engine, persistence or full historical contract. No production edits; offline guard and config-free Vitest. Sol review required.
