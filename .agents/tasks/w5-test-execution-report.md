============================= test session starts =============================
platform win32 -- Python 3.13.7, pytest-9.1.1, pluggy-1.6.0 -- C:\Program Files\Python313\python.exe
cachedir: .pytest_cache
rootdir: E:\onlinewebsites\quiz-platform\services\project-ai
configfile: pyproject.toml
plugins: anyio-4.12.0, dash-3.3.0, asyncio-1.4.0, cov-7.1.0
asyncio: mode=Mode.AUTO, debug=False, asyncio_default_fixture_loop_scope=None, asyncio_default_test_loop_scope=function
collecting ... collected 18 items

services\project-ai\tests\integration\test_placement_engine.py::test_match_candidate_to_add_manifest SKIPPED [  5%]
services\project-ai\tests\integration\test_placement_engine.py::test_match_candidate_to_update_manifest SKIPPED [ 11%]
services\project-ai\tests\integration\test_placement_engine.py::test_match_candidate_by_family_version SKIPPED [ 16%]
services\project-ai\tests\integration\test_placement_engine.py::test_no_match_for_rejected_manifest SKIPPED [ 22%]
services\project-ai\tests\integration\test_placement_engine.py::test_match_with_structural_similarity SKIPPED [ 27%]
services\project-ai\tests\integration\test_placement_engine.py::test_score_exact_family_version_match SKIPPED [ 33%]
services\project-ai\tests\integration\test_placement_engine.py::test_score_penalizes_conflicts SKIPPED [ 38%]
services\project-ai\tests\integration\test_placement_engine.py::test_score_availability_preference SKIPPED [ 44%]
services\project-ai\tests\integration\test_placement_engine.py::test_score_reasoning_populated SKIPPED [ 50%]
services\project-ai\tests\integration\test_placement_engine.py::test_detect_placement_conflict SKIPPED [ 55%]
services\project-ai\tests\integration\test_placement_engine.py::test_resolve_conflict_by_score SKIPPED [ 61%]
services\project-ai\tests\integration\test_placement_engine.py::test_conflict_evidence_recorded SKIPPED [ 66%]
services\project-ai\tests\integration\test_placement_engine.py::test_override_placement_manual SKIPPED [ 72%]
services\project-ai\tests\integration\test_placement_engine.py::test_override_requires_approval SKIPPED [ 77%]
services\project-ai\tests\integration\test_placement_engine.py::test_placement_persisted_to_database SKIPPED [ 83%]
services\project-ai\tests\integration\test_placement_engine.py::test_placement_engine_result_creation SKIPPED [ 88%]
services\project-ai\tests\integration\test_placement_engine.py::test_match_result_creation SKIPPED [ 94%]
services\project-ai\tests\integration\test_placement_engine.py::test_placement_score_creation SKIPPED [100%]

============================= 18 skipped in 0.06s =============================
