#!/bin/bash
set -e

# Load unified root .env if present
if [ -f /app/.env ]; then
  echo "Loading unified root .env configuration..."
  cp -n /app/.env /app/backend/.env 2>/dev/null || true
  cp -n /app/.env /app/frontend/.env 2>/dev/null || true
  set -a
  source /app/.env
  set +a
fi

echo "Starting local PostgreSQL daemon..."
# If the mounted volume is empty, initialize the Postgres data dir first
PG_DATA=/var/lib/postgresql/data
PG_VERSION=$(ls /etc/postgresql/)
if [ ! -f "$PG_DATA/PG_VERSION" ]; then
  echo "Initializing PostgreSQL data directory in volume..."
  chown -R postgres:postgres "$PG_DATA"
  su - postgres -c "/usr/lib/postgresql/$PG_VERSION/bin/initdb -D $PG_DATA"
  echo "listen_addresses='*'" >> "$PG_DATA/postgresql.conf"
fi

service postgresql start

# Ensure dogfood role and database exist (least-privilege: not SUPERUSER)
su - postgres -c "psql" <<'EOF'
DO $body$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'dogfood') THEN
    CREATE ROLE dogfood WITH LOGIN PASSWORD 'dogfood';
  END IF;
END
$body$;
SELECT 'CREATE DATABASE dogfood OWNER dogfood' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'dogfood')\gexec
GRANT ALL PRIVILEGES ON DATABASE dogfood TO dogfood;
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
