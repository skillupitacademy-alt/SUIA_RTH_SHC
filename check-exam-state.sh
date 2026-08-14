#!/bin/bash

echo "=== Checking Exam State in Database ==="
echo ""

EXAM_ID="47466244-f757-465b-965e-38e93e4fcdbe"

ssh root@72.61.115.49 << 'ENDSSH'
cd /opt/platform

# Find the database connection from api-server environment
DB_URL=$(docker compose -f compose/docker-compose.yml -f compose/docker-compose.production.yml exec -T api-server printenv DATABASE_URL 2>/dev/null | tr -d '\r')

if [ -z "$DB_URL" ]; then
    echo "❌ Could not get DATABASE_URL from api-server"
    exit 1
fi

echo "✅ Database URL found"
echo ""

# Extract connection details
DB_HOST=$(echo $DB_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DB_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DB_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
DB_USER=$(echo $DB_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DB_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')

echo "📊 QUERY 1: Exam Questions State"
echo "================================"
PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
SELECT 
    eq.id, 
    eq.question_id, 
    eq.user_answer, 
    eq.is_correct, 
    eq.response_metadata::text
FROM exam_questions eq
WHERE eq.exam_id = '47466244-f757-465b-965e-38e93e4fcdbe'
ORDER BY eq.\"order\"
LIMIT 10;
"

echo ""
echo "📊 QUERY 2: Exam Header Info"
echo "============================="
PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
SELECT 
    id,
    status,
    total_score,
    started_at,
    completed_at,
    last_answered_at
FROM exams
WHERE id = '47466244-f757-465b-965e-38e93e4fcdbe';
"

echo ""
echo "📊 QUERY 3: Sample Question Options (to check format)"
echo "======================================================"
PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
SELECT 
    q.id,
    q.type,
    q.correct_answer,
    q.options::text
FROM questions q
INNER JOIN exam_questions eq ON eq.question_id = q.id
WHERE eq.exam_id = '47466244-f757-465b-965e-38e93e4fcdbe'
LIMIT 3;
"

ENDSSH

echo ""
echo "✅ Diagnostic queries complete!"
