import csv
import json
from pathlib import Path

directory = Path(__file__).resolve().parent
prior = directory.parent / 'r5-existing-p1' / 'AUTHENTICATED_AUTHORIZATION_MATRIX.csv'
runtime = json.loads((directory / 'authenticated-http-results.json').read_text())
quiz = json.loads((directory / 'quiz-positive-http-results.json').read_text())
answer_path = directory / 'quiz-answer-http-results.json'
answers = json.loads(answer_path.read_text()) if answer_path.exists() else {'results': []}
rows = list(csv.DictReader(prior.open(encoding='utf-8-sig', newline='')))
columns = list(rows[0]) + ['r6_case_evidence', 'r6_result', 'r6_remaining_scope']
actions = {
    ('/api/admin/questions/[id]', 'DELETE'),
    ('/api/admin/blueprints/[id]', 'PATCH'),
    ('/api/admin/domains/batch-delete', 'POST'),
    ('/api/tutorial-composer/sections/[sectionId]/publish', 'POST'),
    ('/api/tutorial-left-sidebar', 'POST'),
}
for row in rows:
    row['r6_case_evidence'] = ''
    row['r6_result'] = row['status']
    row['r6_remaining_scope'] = row['gap']
    if row['scope'] == 'OWNER HOLD':
        row['r6_result'] = 'PENDING'
        row['r6_remaining_scope'] = 'OWNER HOLD. No dedicated R6 inspection or execution.'
        continue
    if row['app'] == 'skillhubcore-admin':
        if row['route'] == '/api/admin/questions/[id]' and row['method'] == 'GET':
            row['r6_case_evidence'] = 'shc-populated-http-results.json: actual SHC password login, populated own question200 through BFF/gateway/backend, current account disabled403 and role demotion403; fixture cleanup verified.'
            row['r6_result'] = 'PARTIAL'
            row['r6_remaining_scope'] = 'Populated read and current-account eligibility verified. Full operation-specific input, action and error permutations remain open.'
        if (row['route'], row['method']) in actions:
            row['r6_case_evidence'] = 'shc-actions-final.log: real JWT signatures, controlled live-account authority, admin/super-admin positives, faculty/student negatives, action-specific permission removal. Unit boundary only.'
            row['r6_result'] = 'PARTIAL'
            row['r6_remaining_scope'] = 'Actual populated operation-specific HTTP mutation and downstream business contract remain outside this bounded guard test.'
        continue
    brand = 'skillup' if row['app'] == 'skillup-web' else 'realtutorialhub'
    matching = [case for case in runtime['results'] if case.get('route') == row['route'] and case.get('method') == row['method'] and (case['name'].startswith(brand) or (brand == 'realtutorialhub' and case['name'].startswith('RTH')))]
    matching += [case for case in quiz['results'] if case.get('route') == row['route'] and case.get('method') == row['method'] and case['name'].startswith(brand)]
    matching += [case for case in answers['results'] if case.get('route') == row['route'] and case.get('method') == row['method'] and case['name'].startswith(brand)]
    if matching:
        row['r6_case_evidence'] = 'authenticated-http-results.json; quiz-positive-http-results.json; quiz-answer-http-results.json. ' + ' | '.join(case['name'] + '=' + str(case['actual']) for case in matching)
        row['r6_result'] = 'PARTIAL'
        row['r6_remaining_scope'] = 'Bounded real authenticated cases verified. Further handler inputs, membership/enrollment policy and full business-state permutations retain the prior gap. See report for the preserved cold-start failure.'

with (directory / 'AUTHENTICATED_AUTHORIZATION_MATRIX_R6.csv').open('w', encoding='utf-8', newline='') as output:
    writer = csv.DictWriter(output, fieldnames=columns)
    writer.writeheader()
    writer.writerows(rows)
assert len(rows) == 195
summary = {state: sum(row['r6_result'] == state for row in rows) for state in sorted({row['r6_result'] for row in rows})}
(directory / 'matrix-summary.json').write_text(json.dumps({'methods': len(rows), 'states': summary, 'boundedR6Rows': sum(bool(row['r6_case_evidence']) for row in rows)}, indent=2))
print(summary)
