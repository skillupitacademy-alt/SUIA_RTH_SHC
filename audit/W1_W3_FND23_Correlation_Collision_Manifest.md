# FND23 correlation versus event identity control manifest

Baseline c1fd6420. Actual shared consumer deduplicates on correlationId, despite envelopes carrying distinct id. Add actual handler control: sequential messages with same correlation but distinct immutable IDs both reach handler; exact retry remains suppressed. Fake verifier/store and offline guard only, no physical queue/Redis or production changes. Selected event identity/claim semantics and worker compatibility remain pending; retain failure.
