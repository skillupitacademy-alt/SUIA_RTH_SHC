# FND13 session mode/status unknown truth manifest

Baseline 4fb2f104. `formatSessionMode` maps missing/unknown mode to hybrid and `formatSessionStatus` maps unknown status to completed; while DB enums currently define known values, adapters/fixtures or historical drift can produce unknown values. FND13 allows existing helper, actual types/consumers, tests. Preserve known modes and statuses and represent unknown explicitly as `unavailable`; no schema, lifecycle or DB change. Guarded helper test plus existing caller checks. No physical DB/browser. Sol review required.
