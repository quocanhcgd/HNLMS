#!/usr/bin/env bash
set -euo pipefail
api_url="${HN_LMS_HEALTH_URL:-http://127.0.0.1:4000/health}"
web_url="${HN_LMS_WEB_URL:-http://127.0.0.1:3000/}"
for attempt in {1..20}; do
  if curl --fail --silent --show-error "$api_url" >/dev/null && curl --fail --silent --show-error "$web_url" >/dev/null; then
    echo "HN LMS health check passed"; exit 0
  fi
  sleep 2
done
echo "HN LMS health check failed" >&2; exit 1
