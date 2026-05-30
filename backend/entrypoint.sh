#!/bin/sh
set -e

echo "=== Initializing Coral Sources ==="
for spec in /app/sources/*.yaml; do
    if [ -f "$spec" ]; then
        echo "Registering source spec: $spec"
        coral source add --file "$spec" || echo "Warning: Failed to add source $spec"
    fi
done
echo "=== Coral Sources Initialized ==="

echo "=== Starting FastAPI Server ==="
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
