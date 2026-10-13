@echo off
git -C "e:\onlinewebsites\quiz-platform" add ".agents\evidence\runs\migration-repair-20261011-143539-06936246\stage5-final-w5a-static-security.json"
git -C "e:\onlinewebsites\quiz-platform" add ".agents\evidence\runs\migration-repair-20261011-143539-06936246\stage5-final-w5a-static-security-doc.md"
git -C "e:\onlinewebsites\quiz-platform" add ".agents\evidence\runs\migration-repair-20261011-143539-06936246\stage5-final-w5b-test.json"
git -C "e:\onlinewebsites\quiz-platform" add ".agents\evidence\runs\migration-repair-20261011-143539-06936246\stage5-final-w5b-test-doc.md"
git -C "e:\onlinewebsites\quiz-platform" add ".agents\evidence\runs\migration-repair-20261011-143539-06936246\stage5-final-w5c-artifact-consistency.json"
git -C "e:\onlinewebsites\quiz-platform" add ".agents\evidence\runs\migration-repair-20261011-143539-06936246\stage5-final-w5c-artifact-consistency-doc.md"
git -C "e:\onlinewebsites\quiz-platform" add ".agents\evidence\runs\migration-repair-20261011-143539-06936246\stage5-final-gate.json"
git -C "e:\onlinewebsites\quiz-platform" commit -m "Stage 5 final triple-review gate results" -m "" -m "All three reviews (static security, test coverage, artifact consistency) approved with no findings." -m "" -m "Run-ID: migration-repair-20261011-143539-06936246"
