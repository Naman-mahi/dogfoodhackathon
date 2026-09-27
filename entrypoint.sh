#!/bin/bash
set -e

echo "Starting local PostgreSQL daemon..."
service postgresql start

# Ensure postgres role and database exist
su - postgres -c "psql" <<'EOF'
DO $body$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'dogfood') THEN
    CREATE ROLE dogfood WITH LOGIN PASSWORD 'dogfood' SUPERUSER;
  END IF;
END
$body$;
SELECT 'CREATE DATABASE dogfood OWNER dogfood' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'dogfood')\gexec
EOF

echo "Initializing database & seeding fixtures..."
cd /app/backend
python3 -c "from app.db.session import init_db; from app.db.seed import seed_database; init_db(); seed_database()"

echo "Starting FastAPI backend with OpenAPI on 127.0.0.1:8000..."
uvicorn app.main:app --app-dir /app/backend --host 127.0.0.1 --port 8000 &

# Wait for backend to be ready
until curl -s http://127.0.0.1:8000/docs > /dev/null 2>&1; do
  sleep 0.5
done
echo "FastAPI backend is ready with OpenAPI docs on /docs"

echo "Starting Next.js portal on port 8080..."
cd /app/frontend
exec npm start -- -p 8080
