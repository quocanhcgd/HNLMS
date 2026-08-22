#!/usr/bin/env bash
set -euo pipefail
backup_dir="${HN_LMS_BACKUP_DIR:-/var/backups/hn-lms}"
mkdir -p "$backup_dir"
file="$backup_dir/hn-lms-$(date -u +%Y%m%dT%H%M%SZ).sql.gz"
pg_dump "${DATABASE_URL:?DATABASE_URL is required}" | gzip > "$file"
chmod 600 "$file"
echo "Backup created: $file"
