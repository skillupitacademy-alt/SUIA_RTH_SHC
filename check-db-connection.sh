#!/bin/bash

# Get DATABASE_URL from api-server container
echo "=== Getting DATABASE_URL ==="
DB_URL=$(ssh root@72.61.115.49 "cd /opt/platform && docker compose -f compose/docker-compose.yml -f compose/docker-compose.production.yml exec -T api-server printenv DATABASE_URL")
echo "DATABASE_URL: $DB_URL"

# Parse connection details
echo -e "\n=== Parsed Connection Details ==="
echo "$DB_URL" | sed 's/postgresql:\/\/\([^:]*\):\([^@]*\)@\([^:]*\):\([^\/]*\)\/\(.*\)/User: \1\nHost: \3\nPort: \4\nDatabase: \5/'

# Try to query exam data directly from api-server using psql
echo -e "\n=== Querying exam data ==="
ssh root@72.61.115.49 "cd /opt/platform && docker compose -f compose/docker-compose.yml -f compose/docker-compose.production.yml exec -T api-server sh -c 'apt-get update -qq && apt-get install -y -qq postgresql-client > /dev/null 2>&1 && psql \$DATABASE_URL -c \"SELECT id, question_id, user_answer, is_correct FROM exam_questions WHERE exam_id = '\''505ecab1-c040-4fc6-845f-3422d8c77236'\'' LIMIT 5;\"'"
