#!/usr/bin/env bash
set -euo pipefail
args=()
[[ "${ALLOW_DOWN:-0}" == "1" ]] && args+=(--allow-down)
[[ "${JSON_OUTPUT:-0}" == "1" ]] && args+=(--json)
node "$(dirname "$0")/../../scripts/check-local-services.mjs" "${args[@]}"
