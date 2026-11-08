# FND24 assignment help route-service composition manifest

Baseline b019e6cf. Extend separate actual route/schema and service fixtures with a single composed real route + real service, using isolated mock auth, repository constructors and publisher. Test verified subject reaches persisted fixture, nonmember denies before write and malformed payload denies before reads. No real verifier, DB, queue, browser or selected progress policy. Pre-import offline guard; no production changes. Sol review required.
