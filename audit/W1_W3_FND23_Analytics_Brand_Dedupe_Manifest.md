# FND23 analytics brand dedupe control manifest

Baseline 8e30f4f8. Actual pipeline's dedupe key hashes event name/payload/anonymousId/sessionId but not trusted input brand. Add guarded actual-pipeline control for identical fixture IDs/payload on two brands, requiring separate events; same-brand retry positive stays deduplicated. Fake config/provider/publisher; no physical network/queue or identity assertion. No runtime change pending event identity and retry contract decision; retain failure.
