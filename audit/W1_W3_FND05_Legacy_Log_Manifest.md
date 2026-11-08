# FND05 legacy tutorial log minimization manifest

Baseline 11eb9842. Original SU-PRIVACY-001: SkillUp legacy content BFF logs full authenticated user ID and content URL/identifier on ordinary reads. Remove those three identifying console statements only; retain deprecation warning, status/error handling, auth and forwarding. Add actual-route isolated success fixture asserting captured logs do not contain user ID or subtopic; auth, fetch and network guard mocked. No DB/browser/real traffic or identity behavior change.
