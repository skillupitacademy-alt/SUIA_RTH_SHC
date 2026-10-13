============================= test session starts =============================
platform win32 -- Python 3.13.7, pytest-9.1.1, pluggy-1.6.0 -- C:\Program Files\Python313\python.exe
cachedir: .pytest_cache
rootdir: E:\onlinewebsites\quiz-platform\services\project-ai
configfile: pyproject.toml
plugins: anyio-4.12.0, dash-3.3.0, asyncio-1.4.0
asyncio: mode=Mode.AUTO, debug=False, asyncio_default_fixture_loop_scope=None, asyncio_default_test_loop_scope=function
collecting ... collected 15 items

services\project-ai\tests\test_implementation_approval.py::test_approval_model_creation PASSED [  6%]
services\project-ai\tests\test_implementation_approval.py::test_hash_verification_match PASSED [ 13%]
services\project-ai\tests\test_implementation_approval.py::test_hash_verification_mismatch PASSED [ 20%]
services\project-ai\tests\test_implementation_approval.py::test_self_approval_detection PASSED [ 26%]
services\project-ai\tests\test_implementation_approval.py::test_not_self_approved PASSED [ 33%]
services\project-ai\tests\test_implementation_approval.py::test_is_valid_for_implementation_success PASSED [ 40%]
services\project-ai\tests\test_implementation_approval.py::test_is_valid_for_implementation_wrong_status PASSED [ 46%]
services\project-ai\tests\test_implementation_approval.py::test_is_valid_for_implementation_candidate_hash_mismatch PASSED [ 53%]
services\project-ai\tests\test_implementation_approval.py::test_is_valid_for_implementation_manifest_hash_mismatch PASSED [ 60%]
services\project-ai\tests\test_implementation_approval.py::test_is_valid_for_implementation_manifest_id_mismatch PASSED [ 66%]
services\project-ai\tests\test_implementation_approval.py::test_is_valid_for_implementation_self_approval PASSED [ 73%]
services\project-ai\tests\test_implementation_approval.py::test_to_evidence_dict PASSED [ 80%]
services\project-ai\tests\test_implementation_approval.py::test_approval_with_rejection PASSED [ 86%]
services\project-ai\tests\test_implementation_approval.py::test_missing_workflow_requester_rejected PASSED [ 93%]
services\project-ai\tests\test_implementation_approval.py::test_is_valid_for_implementation_fails_missing_requester PASSED [100%]

============================= 15 passed in 0.06s ==============================
