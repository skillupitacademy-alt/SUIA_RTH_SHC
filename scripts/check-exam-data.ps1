#!/usr/bin/env pwsh

$examId = "505ecab1-c040-4fc6-845f-3422d8c77236"

Write-Host "=== Checking Exam Data for: $examId ===" -ForegroundColor Cyan

# Check exam_questions table
Write-Host "`nChecking exam_questions table..." -ForegroundColor Yellow
ssh root@72.61.115.49 @"
cd /opt/platform && docker compose -f compose/docker-compose.yml -f compose/docker-compose.production.yml exec -T postgres psql -U quiz_user -d quiz_platform -c "SELECT id, question_id, user_answer, is_correct FROM exam_questions WHERE exam_id = '$examId' LIMIT 10;"
"@

# Check exams table
Write-Host "`nChecking exams table..." -ForegroundColor Yellow
ssh root@72.61.115.49 @"
cd /opt/platform && docker compose -f compose/docker-compose.yml -f compose/docker-compose.production.yml exec -T postgres psql -U quiz_user -d quiz_platform -c "SELECT id, status, total_score, completed_at FROM exams WHERE id = '$examId';"
"@

Write-Host "`nDone!" -ForegroundColor Green
