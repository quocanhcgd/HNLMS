#!/usr/bin/env bash
set -Eeuo pipefail

# One-command installer for a clean Ubuntu host.
# Nginx and TLS are intentionally excluded; use Nginx Proxy Manager upstream.

readonly repo_url="${HN_LMS_REPO_URL:-https://github.com/quocanhcgd/HNLMS.git}"
readonly ref="${HN_LMS_REF:-main}"
readonly app_root="${HN_LMS_APP_ROOT:-/opt/hn-lms}"
readonly env_file="${HN_LMS_ENV_FILE:-/etc/hn-lms/hn-lms.env}"
readonly run_user="${HN_LMS_USER:-hnlms}"
readonly deploy_script_url="${HN_LMS_DEPLOY_SCRIPT_URL:-https://raw.githubusercontent.com/quocanhcgd/HNLMS/main/infra/deploy/ubuntu-deploy.sh}"

log() { printf '[hn-lms-install] %s\n' "$*"; }
fail() { printf '[hn-lms-install] ERROR: %s\n' "$*" >&2; exit 1; }

[[ "$(id -u)" -eq 0 ]] || fail "Run this script as root (sudo)."
command -v apt-get >/dev/null 2>&1 || fail "This script requires apt-get."
[[ -r /etc/os-release ]] || fail "Cannot identify operating system."
# shellcheck disable=SC1091
source /etc/os-release
[[ "$ID" == "ubuntu" ]] || fail "Ubuntu is required; detected: $ID"

export DEBIAN_FRONTEND=noninteractive
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
umask 077

log "Installing Ubuntu packages"
apt-get update
apt-get install -y --no-install-recommends \
  ca-certificates curl git build-essential pkg-config python3 gnupg openssl \
  postgresql-client unzip

log "Installing Node.js 20"
install -d -m 0755 /etc/apt/keyrings
curl --fail --silent --show-error --location \
  https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
  | gpg --dearmor --yes -o /etc/apt/keyrings/nodesource.gpg
printf '%s\n' \
  'deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main' \
  > /etc/apt/sources.list.d/nodesource.list
apt-get update
apt-get install -y --no-install-recommends nodejs

node_major="$(node --version | sed -E 's/^v([0-9]+).*/\1/')"
[[ "$node_major" == "20" ]] || fail "Node.js 20.x is required; installed $(node --version)"

log "Creating application account and directories"
if ! id -u "$run_user" >/dev/null 2>&1; then
  useradd --system --home-dir "$app_root" --shell /usr/sbin/nologin "$run_user"
fi
install -d -o "$run_user" -g "$run_user" -m 0755 \
  "$app_root" "$app_root/source" "$app_root/releases" /var/lib/hn-lms
install -d -o root -g root -m 0755 "$(dirname "$env_file")"

if [[ -s "$env_file" ]]; then
  log "Using existing environment file: $env_file"
else
  web_origin="${HN_LMS_WEB_ORIGIN:-}"
  api_url="${HN_LMS_API_URL:-}"
  database_url="${HN_LMS_DATABASE_URL:-}"
  [[ -n "$web_origin" ]] || read -r -p "Public web URL (for example https://lms.example.com): " web_origin
  [[ -n "$api_url" ]] || read -r -p "Public API URL (for example https://api.example.com): " api_url
  [[ -n "$database_url" ]] || read -r -s -p "Remote PostgreSQL DATABASE_URL: " database_url
  printf '\n'
  [[ -n "$web_origin" && -n "$api_url" && -n "$database_url" ]] || fail "Web URL, API URL and DATABASE_URL are required"
  session_secret="${HN_LMS_SESSION_SECRET:-$(openssl rand -hex 32)}"
  [[ "${#session_secret}" -ge 32 ]] || fail "HN_LMS_SESSION_SECRET must contain at least 32 characters"
  env_tmp="$(mktemp "$(dirname "$env_file")/.hn-lms.env.XXXXXX")"
  {
    printf 'NODE_ENV=production\nAPI_PORT=4000\n'
    printf 'WEB_ORIGIN=%q\n' "$web_origin"
    printf 'NEXT_PUBLIC_SITE_URL=%q\n' "$web_origin"
    printf 'NEXT_PUBLIC_API_URL=%q\n' "$api_url"
    printf 'DATABASE_URL=%q\n' "$database_url"
    printf 'SESSION_SECRET=%q\n' "$session_secret"
  } > "$env_tmp"
  chown root:root "$env_tmp"
  chmod 0600 "$env_tmp"
  mv -f "$env_tmp" "$env_file"
  log "Created protected environment file: $env_file"
fi
chmod 0600 "$env_file"

log "Checking remote PostgreSQL connectivity"
set -a
# shellcheck disable=SC1090
source "$env_file"
set +a
[[ "${NODE_ENV:-}" == "production" ]] || fail "NODE_ENV=production is required in $env_file"
[[ -n "${DATABASE_URL:-}" ]] || fail "DATABASE_URL is required in $env_file"
[[ -n "${SESSION_SECRET:-}" && "${#SESSION_SECRET}" -ge 32 ]] || fail "SESSION_SECRET must contain at least 32 characters"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c 'select 1' >/dev/null \
  || fail "Cannot connect to remote PostgreSQL using DATABASE_URL"

work_dir="$(mktemp -d)"
trap 'rm -rf "$work_dir"' EXIT
curl --fail --silent --show-error --location "$deploy_script_url" \
  --output "$work_dir/ubuntu-deploy.sh"
chmod 0755 "$work_dir/ubuntu-deploy.sh"

log "Deploying commit/ref: $ref"
HN_LMS_REPO_URL="$repo_url" \
HN_LMS_REF="$ref" \
HN_LMS_APP_ROOT="$app_root" \
HN_LMS_ENV_FILE="$env_file" \
HN_LMS_USER="$run_user" \
  bash "$work_dir/ubuntu-deploy.sh"

log "Installation completed"
log "Nginx was not installed; configure Nginx Proxy Manager upstreams:"
log "  web -> this-server:3000"
log "  api -> this-server:4000"
log "Check: systemctl status hn-lms-api hn-lms-web hn-lms-worker"
