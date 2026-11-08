# FND22 contract read side effect control manifest

Baseline 44078178. Actual client getEngineeringContract automatically POSTs generation after GET 404. Add guarded intercepted-fetch controls describing existing 404 GET→POST and GET 200 no POST, without asserting policy correctness. No backend/workflow mutation/network/browser; pre-import guard. Sol must select explicit read/generation semantics.
