#!/usr/bin/env bash
set -euo pipefail
[[ $# -eq 1 ]] || { echo "Usage: $0 <version>" >&2; exit 2; }
release_root=/opt/hn-lms/releases; target="$release_root/$1"
[[ "$1" =~ ^[A-Za-z0-9._-]+$ && -d "$target" ]] || { echo "Invalid release" >&2; exit 1; }
previous="$(readlink -f /opt/hn-lms/current || true)"
printf '%s\n' "$previous" > /var/lib/hn-lms/previous-release
ln -sfn "$target" /opt/hn-lms/current
systemctl restart hn-lms-api hn-lms-worker hn-lms-web
"$(dirname "$0")/health-check.sh"
echo "Activated $target"
