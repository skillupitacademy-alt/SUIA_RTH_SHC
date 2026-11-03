# Stash closure - 2026-11-03

Owner requested closure of all three saved stashes after the accepted remediation
branches were merged into main at 4bcd2a06. The owner identified stash 0 as the GUI
color organization work. These are saved working changes, not unmerged branches.

## Disposition

| Original stash | Disposition |
| --- | --- |
| 0: brand-themes-canonicalization-on-main | Restored and integrated. Canonical SkillUp/RTH palettes now supply Composer, learner sidebar delivery and shared accent configuration. |
| 1: project-llm-e2e-implementation | Historical execution-log additions only. Archived, not replayed into the current log. Its source branch is already an ancestor of main. |
| 2: m2-project-ai-canonical-wiring | Superseded working snapshot. Theme certification additions and old document removal are already present; historical run timestamp is not current evidence. Current placement code has authenticated, PostgreSQL-backed approval enforcement and recomputes candidate hashes. Do not replay the old in-memory stores and legacy approval fallback over it. |

The stash-2 candidate.py patch is not byte-identical to current main. Its intent
is covered by the newer implementation; this is a reviewed supersession decision,
not a claim that every stashed line was merged. The complete saved objects remain
recoverable through the local archive tags below.

| Local recovery tag | Original stash object |
| --- | --- |
| archive/stash-0-brand-colors-20261103 | 7b1e7e90bb65f6dd990f911f7a3f2073b9c1bca1 |
| archive/stash-1-e2e-evidence-20261103 | 95ba70b3943333bbb9a95003f58869e38c97d9a9 |
| archive/stash-2-m2-workflow-20261103 | 27ce1e752a7e5ef42f016e0f339f3647dec83c7f |

## Color restoration

Restored the five-file stash, keeping its existing brand colors. Replaced the
Composer wrapper with a direct canonical re-export, kept type-only imports, and
made the newly restored shared accent values reference the canonical palette.
Learner delivery now receives the full palette including accents/step markers.
No new organized/unorganized component taxonomy or site-wide recoloring was
invented: this integrates the actual saved color work.

The deprecated Python theme-discovery compatibility path can find the canonical
definitions. Its legacy RTH fallback now searches after the SkillUp branch rather
than incorrectly selecting SkillUp's first return object. The production snapshot
discovery interface remains unchanged.

## Verification

- Shared types suite: 13 files / 243 tests passed, exit 0.
- Direct TypeScript smoke check: Composer/shared palette parity, RTH alias and
  existing shared-to-SkillUp visual fallback passed, exit 0. This visual fallback
  grants no tenant identity or permission.
- Python direct check: canonical discovery returns distinct SkillUp/RTH palettes
  from packages/types; legacy file compatibility returns the correct separate
  brand colors, exit 0. No live database access.
- SHC typecheck: exit 0. Additional scoped TypeScript compilation including both shared files: exit 0.
- Scoped ESLint with an explicit project covering all four TypeScript files: 0 errors, exit 0; three existing warnings in tutorialSidebarDelivery.ts (unused canonicalSubtopicSlug and two any casts), confirmed against the pre-restoration main. The zero-warning invocation correctly fails on those existing warnings; no rule suppression was added.
- Initial lint attempts lacked a shared-file project configuration; final checks used temporary verification configs, removed afterward.
- git diff --check: passed.

This is local source/contract verification, not visual browser qualification or
a deployment. Earlier audit statements that three stashes were preserved describe
their historical checkpoint; this record supersedes them for current stash status.
Archive references retain recovery data after the three stash entries are dropped.
