from unittest.mock import MagicMock, patch
from app.verification.learner_runtime_verifier import _skillup_preview_at_commit


def test_preview_does_not_block_on_undrained_log_pipes(tmp_path, monkeypatch):
    monkeypatch.setenv('PROJECT_LLM_LEARNER_API_BASE_URL', 'http://localhost:3000/api')
    worktree = tmp_path / 'worktree'
    worktree.mkdir()
    process = MagicMock(pid=123)
    process.poll.return_value = None
    response = MagicMock()
    response.__enter__.return_value.status = 200
    with patch('app.verification.learner_runtime_verifier._create_verification_worktree', return_value=worktree), \
         patch('app.verification.learner_runtime_verifier._prepare_dependencies', return_value=[]), \
         patch('app.verification.learner_runtime_verifier.verification_database_url', return_value='postgresql://test@localhost/test'), \
         patch('app.verification.learner_runtime_verifier.subprocess.run', return_value=MagicMock(returncode=0)), \
         patch('app.verification.learner_runtime_verifier.subprocess.Popen', return_value=process) as popen, \
         patch('app.verification.learner_runtime_verifier.urllib.request.urlopen', return_value=response), \
         patch('app.verification.learner_runtime_verifier._kill_process_tree') as kill, \
         patch('app.verification.learner_runtime_verifier._cleanup_verification_worktree') as cleanup:
        with _skillup_preview_at_commit(tmp_path, 'a' * 40):
            stdout = popen.call_args.kwargs['stdout']
            assert hasattr(stdout, 'fileno')
            assert not stdout.closed
            assert popen.call_args.kwargs['env']['PROJECT_LLM_ISOLATED_VERIFICATION'] == 'true'
        assert stdout.closed
        kill.assert_called_once_with(123)
        cleanup.assert_called_once()
