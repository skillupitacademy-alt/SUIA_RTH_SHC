# AI Execution Guide

Last updated: April 2, 2026, with current-repo delta appended after placement verification work.

This file is the practical execution guide for AI agents working in this repo.
It exists to reduce confusion caused by overlapping historical `.kiro` documents.

## Execution Priority

Use this order when deciding what to trust:

1. Current repo state
2. `.kiro/DEPLOYMENT_STATUS_MATRIX.md`
3. `.kiro/DEPLOYMENT_CHECKLIST_REVIEW.md`
4. `.kiro/APPROVED_DEPLOYMENT_PLAN.md`
5. `.kiro/specs/multi-brand-auth-architecture/requirements.md`
6. `.kiro/specs/multi-brand-auth-architecture/design.md`
7. Older planning, prompt, chat, and steering docs

## What This Means

- Treat spec files as target architecture.
- Treat the deployment matrix as the best current-state document.
- Treat the repo as the final authority whenever docs and code disagree.
- Do not reopen already-solved March 30 tasks without checking the repo first.

## Fast Reading Order

For deployment or architecture work:
1. Read `.kiro/DEPLOYMENT_STATUS_MATRIX.md`
2. Verify the affected repo files directly
3. Read `.kiro/specs/multi-brand-auth-architecture/requirements.md` only for target-state intent
4. Read `.kiro/specs/multi-brand-auth-architecture/design.md` only when implementation detail is needed

For frontend or placement work:
1. Read the relevant app files in `apps/`
2. Read `.kiro/DEPLOYMENT_STATUS_MATRIX.md`
3. Read `.kiro/specs/multi-brand-auth-architecture/frontend/` docs only as supporting context

## Current Normalization Rules

- `user.realtutorialhub.com` is the active RTH user host for current public auth flow.
- `user.skillupitacademy.com` is the active SkillUp user host.
- `quiz.skillhubcore.in`, `tutorial.skillhubcore.in`, and `placement.skillhubcore.in` are the shared-host targets.
- Older references such as `quiz.realtutorialhub.com`, `notes.realtutorialhub.com`, and `app.skillupitacademy.com` should be treated as historical unless confirmed in current code or live checks.

## Current Placement Guidance

- The repo now contains a shared placement app at `apps/skillhub-placement`.
- Gateway config includes `PLACEMENT_URL` routing.
- SkillUp student placement entrypoints now point at the shared host.
- A first shared-host application flow is now implemented:
  - application insert into `placement_prod`
  - duplicate protection
  - applied-state rendering
- The remaining placement work is to finish workflow depth:
  - cross-domain session handoff
  - live deployment verification of the shared host
  - deeper post-apply workflow such as offers, interviews, and full learner/session integration

## Known Documentation Problems

- Some `.kiro` files are stale relative to the repo.
- Several files are explicitly superseded but still present in active directories.
- Encoding corruption is present in multiple markdown files.
- This file and the deployment matrix should be used as the normalization layer until the older docs are cleaned up.

## Working Rule For AI Agents

Before starting substantial work:
1. inspect the repo state for the feature
2. compare it against `.kiro/DEPLOYMENT_STATUS_MATRIX.md`
3. classify the task as one of:
   - already done
   - partially done
   - stale doc only
   - still missing
4. only then implement the next smallest useful step

## Current Next Placement Step

The next useful placement step after the first shared apply flow is:
- verify the shared host is live on the correct deployment
- wire cross-domain placement session handoff fully
- extend the workflow beyond initial application capture

After that:
- re-run placement verification
- update `.kiro/DEPLOYMENT_STATUS_MATRIX.md` again
