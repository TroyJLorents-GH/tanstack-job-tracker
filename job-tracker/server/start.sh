#!/bin/sh
set -e

# Use PORT environment variable if set, otherwise default to 8080
PORT=${PORT:-8080}

echo "Starting uvicorn on port $PORT"
echo "Python version: $(python --version)"
echo "Working directory: $(pwd)"
echo "Contents of /app:"
ls -la

# Check if main.py exists
if [ ! -f "main.py" ]; then
    echo "ERROR: main.py not found!"
    exit 1
fi

# Try to import the app first to catch any import errors
echo "Checking Python imports..."
if ! python -c "import main; print('Import successful')"; then
    echo "ERROR: Failed to import main module"
    exit 1
fi

exec uvicorn main:app --host 0.0.0.0 --port "$PORT"

