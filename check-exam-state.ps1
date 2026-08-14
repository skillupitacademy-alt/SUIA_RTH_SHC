#!/usr/bin/env pwsh

Write-Host "=== Checking Exam State in Database ===" -ForegroundColor Cyan
Write-Host ""

$examId = "47466244-f757-465b-965e-38e93e4fcdbe"

Write-Host "QUERY 1: Exam Questions State" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Yellow

$query1 = 'SELECT eq.id, eq.question_id, eq.user_answer, eq.is_correct FROM exam_questions eq WHERE eq.exam_id = ' + "'$examId'" + ' ORDER BY eq."order" LIMIT 10;'

ssh root@72.61.115.49 "cd /opt/platform; DB_URL=`$(docker compose -f compose/docker-compose.yml -f compose/docker-compose.production.yml exec -T api-server printenv DATABASE_URL 2>/dev/null | tr -d '\r'); DB_HOST=`$(echo `$DB_URL | sed -n 's/.*@\([^:]*\):.*/\1/p'); DB_PORT=`$(echo `$DB_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p'); DB_NAME=`$(echo `$DB_URL | sed -n 's/.*\/\([^?]*\).*/\1/p'); DB_USER=`$(echo `$DB_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p'); DB_PASS=`$(echo `$DB_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p'); PGPASSWORD=\"`$DB_PASS\" psql -h \"`$DB_HOST\" -p \"`$DB_PORT\" -U \"`$DB_USER\" -d \"`$DB_NAME\" -c \"$query1\""

Write-Host ""
Write-Host "QUERY 2: Exam Header Info" -ForegroundColor Yellow
Write-Host "=============================" -ForegroundColor Yellow

$query2 = 'SELECT id, status, total_score, started_at, completed_at FROM exams WHERE id = ' + "'$examId'" + ';'

ssh root@72.61.115.49 "cd /opt/platform; DB_URL=`$(docker compose -f compose/docker-compose.yml -f compose/docker-compose.production.yml exec -T api-server printenv DATABASE_URL 2>/dev/null | tr -d '\r'); DB_HOST=`$(echo `$DB_URL | sed -n 's/.*@\([^:]*\):.*/\1/p'); DB_PORT=`$(echo `$DB_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p'); DB_NAME=`$(echo `$DB_URL | sed -n 's/.*\/\([^?]*\).*/\1/p'); DB_USER=`$(echo `$DB_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p'); DB_PASS=`$(echo `$DB_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p'); PGPASSWORD=\"`$DB_PASS\" psql -h \"`$DB_HOST\" -p \"`$DB_PORT\" -U \"`$DB_USER\" -d \"`$DB_NAME\" -c \"$query2\""

Write-Host ""
Write-Host "QUERY 3: Sample Question Options" -ForegroundColor Yellow
Write-Host "====================================" -ForegroundColor Yellow

$query3 = 'SELECT q.id, q.type, q.correct_answer, LEFT(q.options::text, 200) as options_preview FROM questions q INNER JOIN exam_questions eq ON eq.question_id = q.id WHERE eq.exam_id = ' + "'$examId'" + ' LIMIT 2;'

ssh root@72.61.115.49 "cd /opt/platform; DB_URL=`$(docker compose -f compose/docker-compose.yml -f compose/docker-compose.production.yml exec -T api-server printenv DATABASE_URL 2>/dev/null | tr -d '\r'); DB_HOST=`$(echo `$DB_URL | sed -n 's/.*@\([^:]*\):.*/\1/p'); DB_PORT=`$(echo `$DB_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p'); DB_NAME=`$(echo `$DB_URL | sed -n 's/.*\/\([^?]*\).*/\1/p'); DB_USER=`$(echo `$DB_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p'); DB_PASS=`$(echo `$DB_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p'); PGPASSWORD=\"`$DB_PASS\" psql -h \"`$DB_HOST\" -p \"`$DB_PORT\" -U \"`$DB_USER\" -d \"`$DB_NAME\" -c \"$query3\""

Write-Host ""
Write-Host "Diagnostic queries complete!" -ForegroundColor Green
