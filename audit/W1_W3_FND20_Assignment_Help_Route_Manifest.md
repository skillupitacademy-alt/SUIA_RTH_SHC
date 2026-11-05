# FND20 assignment help route boundary control manifest

Baseline 9c378e74. Actual RTH help route validates UUID subtopic/assignment and question, forwards authenticated subject to service, and returns 201. Add isolated actual route/schema control with auth/service fixture and offline guard: valid payload forwards exact principal, malformed input denies before service, auth failure denies. This is not progress/tenant policy or real authentication/DB proof. No production change. Sol review required.
