# FND19 taxonomy delete failure controls manifest

Baseline ac6d302d. Existing 27eda5c1 uses generic failure messages on taxonomy deletes; individual mounted adverse controls were not executed. Add isolated actual SubjectTable and SkillTable failure controls using disposable IDs, mocked API/card/dialog and pre-import network guard. Verify request ID, truthful generic error, no fabricated dependency cause. No production changes, actual API/database and browser NOT EXECUTED. Sol review required.

Manifest amendment before further test edits: include existing TopicTable and SubtopicTable mounted tests, with actual row delete buttons, in the same guarded scope. These controls target generic error handling and do not exercise physical APIs.
