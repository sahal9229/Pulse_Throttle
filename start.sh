#!/usr/bin/env bash
# ==============================================================================
# PulseThrottle Startup Script (Cloud / Local Container)
# ==============================================================================
set -e

PORT="${PORT:-8000}"
HOST="${HOST:-0.0.0.0}"

echo "🚀 Starting PulseThrottle Telemetry API on ${HOST}:${PORT}..."
exec uvicorn api_server:app --host "${HOST}" --port "${PORT}"
