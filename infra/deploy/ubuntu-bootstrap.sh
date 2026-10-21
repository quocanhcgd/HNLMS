#!/usr/bin/env bash
set -Eeuo pipefail

# Bootstrap a minimal Ubuntu host for the HN-LMS native deployment script.
# This installs runtime dependencies only; PostgreSQL remains an external service.

readonly app_root="${HN_LMS_APP_ROOT:-/opt/hn-lms}"
readonly env_file="${HN_LMS_ENV_FILE:-/etc/hn-lms/hn-lms.env}"
readonly run_user="${HN_LMS_USER:-hnlms}"
readonly install_nginx="${HN_LMS_INSTALL_NGINX:-1}"

log() { printf '[hn-lms-bootstrap] %s\n' "$*"; }
fail() { printf '[hn-lms-bootstrap] ERROR: %s\n' "$*" >&2; exit 1; }

[[ "$(id -u)" -eq 0 ]] || fail "Run this script as root (sudo)."
command -v apt-get >/dev/null 2>&1 || fail "This script requires apt-get."
[[ -r /etc/os-release ]] || fail "Cannot identify operating system."
# shellcheck disable=SC1091
source /etc/os-release
[[ "$ID" == "ubuntu" ]] || fail "Ubuntu is required; detected: $ID"

export DEBIAN_FRONTEND=noninteractive
log "Installing base packages"
apt-get update
apt-get install -y --no-install-recommends \
  ca-certificates \
  curl \
  git \
  build-essential \
  pkg-config \
  python3 \
  gnupg \
  nginx \
  openssl \
  postgresql-client \
  unzip

log "Configuring NodeSource Node.js 20 repository"
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
npm --version >/dev/null

if ! id -u "$run_user" >/dev/null 2>&1; then
  useradd --system --home-dir "$app_root" --shell /usr/sbin/nologin "$run_user"
fi
install -d -o "$run_user" -g "$run_user" -m 0755 \
  "$app_root" \
  "$app_root/source" \
  "$app_root/releases" \
  /var/lib/hn-lms
install -d -o root -g root -m 0755 "$(dirname "$env_file")"
if [[ ! -e "$env_file" ]]; then
  install -o root -g root -m 0600 /dev/null "$env_file"
fi
chmod 0600 "$env_file"

if [[ "$install_nginx" == "1" ]]; then
  command -v systemctl >/dev/null 2>&1 || fail "systemctl is required to manage Nginx"
  systemctl enable --now nginx
fi

log "Bootstrap completed"
log "Node: $(node --version)"
log "npm: $(npm --version)"
log "Git: $(git --version | awk '{print $3}')"
log "Nginx: $(nginx -v 2>&1 | sed 's#^nginx/##')"
log "Environment file: $env_file (mode 0600)"
log "Next: edit $env_file, then run infra/deploy/ubuntu-deploy.sh"
