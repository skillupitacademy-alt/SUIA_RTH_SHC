# FND04 bidirectional export tenant probe manifest

Baseline 565b2b63. Existing download test covers foreign RTH principal against implicit SkillUp owner fixture. Extend actual route isolated fixture test to reverse direction, retaining jobId/examId denials and zero storage/fetch assertions. Fixtures lack authoritative tenant provenance, so failure demonstrates missing information/guard, not physical DB exploitability. No production changes; use existing network guard and isolated token/storage fixtures. Sol review required.
