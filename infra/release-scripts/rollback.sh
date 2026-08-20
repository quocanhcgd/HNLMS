#!/usr/bin/env bash
set -euo pipefail
state=/var/lib/hn-lms/previous-release
[[ -f "$state" ]] || { echo "No previous release recorded" >&2; exit 1; }
previous="$(cat "$state")"; release_root=/opt/hn-lms/releases
[[ -d "$previous" && "$previous" == "$release_root/"* ]] || { echo "Unsafe previous release" >&2; exit 1; }
ln -sfn "$previous" /opt/hn-lms/current
systemctl restart hn-lms-api hn-lms-worker hn-lms-web
"$(dirname "$0")/health-check.sh"
echo "Rolled back to $previous"
