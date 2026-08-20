#!/usr/bin/env bash
set -euo pipefail

for command in node npm systemctl nginx curl sha256sum; do
  command -v "$command" >/dev/null || { echo "Missing command: $command" >&2; exit 1; }
done

node_major="$(node --version | sed -E 's/^v([0-9]+).*/\1/')"
[[ "$node_major" == "20" ]] || { echo "Node.js 20 is required" >&2; exit 1; }
[[ -f /etc/hn-lms/hn-lms.env ]] || { echo "Missing /etc/hn-lms/hn-lms.env" >&2; exit 1; }
[[ "$(stat -c '%a' /etc/hn-lms/hn-lms.env)" == "600" ]] || { echo "Environment file must be mode 0600" >&2; exit 1; }
nginx -t

echo "HN LMS native deployment preflight passed"
