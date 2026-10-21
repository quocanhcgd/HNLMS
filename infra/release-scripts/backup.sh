#!/usr/bin/env bash
set -euo pipefail
backup_dir="${HN_LMS_BACKUP_DIR:-/var/backups/hn-lms}"
mkdir -p "$backup_dir"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
file="$backup_dir/hn-lms-${timestamp}.sql.gz.enc"
tmp="$(mktemp "${TMPDIR:-/tmp}/hn-lms-backup.XXXXXX.sql.gz")"
cleanup() { rm -f "$tmp"; }
trap cleanup EXIT

: "${DATABASE_URL:?DATABASE_URL is required}"
: "${HN_LMS_BACKUP_ENCRYPT_COMMAND:?HN_LMS_BACKUP_ENCRYPT_COMMAND is required (external KMS hook)}"
: "${HN_LMS_BACKUP_KEY_REF:?HN_LMS_BACKUP_KEY_REF is required}"
umask 077
pg_dump "$DATABASE_URL" | gzip > "$tmp"
# The configured command must encrypt its first argument to its second argument.
sh -c "$HN_LMS_BACKUP_ENCRYPT_COMMAND \"\$1\" \"\$2\"" -- "$tmp" "$file"
test -s "$file"
if command -v sha256sum >/dev/null 2>&1; then
  sha256sum "$file" > "${file}.sha256"
else
  shasum -a 256 "$file" > "${file}.sha256"
fi
chmod 600 "$file" "${file}.sha256"
echo "Encrypted backup created: $file"
