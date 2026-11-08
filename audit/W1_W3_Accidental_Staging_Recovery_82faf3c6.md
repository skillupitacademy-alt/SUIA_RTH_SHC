# Accidental staging recovery

Recorded by Sol / Codex on 2026-11-06. Starting HEAD 82faf3c6 on
remediation/w1-2-batch-05-targeted followed accidental staging commit f351b7dc.
The working tree and index were clean at inspection.

The accidental commit introduced local tooling configuration, the generated knowledge
graph, root agent instructions and a temporary whitespace script into tracked history.
This recovery restores those specific added paths to their former local-only state.
The decision follows the implementer's explicit report of accidental inclusion.

The correction removes 1,224 paths from the index, preserving every local file.
Affected paths are .claude/, .codex/, graphify-out/, AGENTS.md, CLAUDE.md and
fix-whitespace.py, limited to additions in f351b7dc. Six patterns in .git/info/exclude
keep those local files out of future broad staging. These excludes are local to this
checkout. The intended whitespace guide under .kiro/steering and audit records remain
tracked, together with all pre-existing implementation/test files.

This is an ordinary corrective commit. Earlier commits, including f351b7dc, remain
reachable in history. It does not purge historical content or claim a credential scan.
No branch reset, rebase or forced publication was performed.

Verification compares the intended final index and committed HEAD with a239ca39 using
git diff --check, with explicit path-scope checks. No application behavior changed in
this recovery, so application tests were not rerun. The prior reported failing schema,
event, ownership and other security controls retain their failed dispositions.

The eight workflow slices remain submitted evidence. Failing regression controls and
partial investigations do not establish complete implementation. FND01-FND30, the nine
groups, Batch 08, BROWSER-01 and RC-ID-01 retain their recorded open acceptance gates.

For subsequent changes, stage only the exact slice paths, inspect git diff --cached
--name-status and git diff --cached --stat, then run git diff --cached --check. After
committing, run git diff --check a239ca39..HEAD for this handoff's final snapshot.
Generated tooling paths require their own reviewed scope if intentionally shared later.
