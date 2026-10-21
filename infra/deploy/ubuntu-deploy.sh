#!/usr/bin/env bash
set -Eeuo pipefail

# Deploy one immutable Git commit to a native Ubuntu host.
# Secrets are read from /etc/hn-lms/hn-lms.env and are never written to the release.

readonly app_name="hn-lms"
readonly repo_url="${HN_LMS_REPO_URL:-https://github.com/quocanhcgd/HNLMS.git}"
readonly ref="${HN_LMS_REF:-main}"
readonly app_root="${HN_LMS_APP_ROOT:-/opt/hn-lms}"
readonly source_root="$app_root/source"
readonly releases_root="$app_root/releases"
readonly current_link="$app_root/current"
readonly env_file="${HN_LMS_ENV_FILE:-/etc/hn-lms/hn-lms.env}"
readonly run_user="${HN_LMS_USER:-hnlms}"
readonly web_port="${HN_LMS_WEB_PORT:-3000}"
readonly api_port="${HN_LMS_API_PORT:-4000}"

log() { printf '[hn-lms] %s\n' "$*"; }
fail() { printf '[hn-lms] ERROR: %s\n' "$*" >&2; exit 1; }

[[ "$(id -u)" -eq 0 ]] || fail "Run this script as root (sudo)."
for command in git node npm systemctl curl runuser; do
  command -v "$command" >/dev/null 2>&1 || fail "Missing command: $command"
done
[[ -r "$env_file" ]] || fail "Missing environment file: $env_file"
[[ "$(stat -c '%a' "$env_file")" == "600" ]] || fail "$env_file must have mode 0600"

node_major="$(node --version | sed -E 's/^v([0-9]+).*/\1/')"
[[ "$node_major" -ge 20 ]] || fail "Node.js 20 or newer is required"

# Load only deployment configuration. The file stays outside Git and systemd reads it directly.
set -a
# shellcheck disable=SC1090
source "$env_file"
set +a
[[ "${NODE_ENV:-}" == "production" ]] || fail "NODE_ENV=production is required in $env_file"
[[ -n "${DATABASE_URL:-}" ]] || fail "DATABASE_URL is required in $env_file"
[[ -n "${SESSION_SECRET:-}" && "${#SESSION_SECRET}" -ge 32 ]] || fail "SESSION_SECRET must contain at least 32 characters"

if ! id -u "$run_user" >/dev/null 2>&1; then
  useradd --system --home-dir "$app_root" --shell /usr/sbin/nologin "$run_user"
fi
install -d -o "$run_user" -g "$run_user" -m 0755 "$app_root" "$source_root" "$releases_root"

if [[ ! -d "$source_root/.git" ]]; then
  rm -rf "$source_root"
  git clone --no-checkout "$repo_url" "$source_root"
fi
git -c "safe.directory=$source_root" -C "$source_root" remote set-url origin "$repo_url"
git -c "safe.directory=$source_root" -C "$source_root" fetch --prune --depth=1 origin "$ref"
commit="$(git -c "safe.directory=$source_root" -C "$source_root" rev-parse 'FETCH_HEAD^{commit}')"
release_id="${commit:0:12}"
release_dir="$releases_root/$release_id"
[[ "$release_dir" == "$releases_root/"* ]] || fail "Unsafe release path"
[[ ! -e "$release_dir" ]] || fail "Release already exists: $release_dir"

log "Preparing commit $commit"
install -d -o "$run_user" -g "$run_user" -m 0755 "$release_dir"
git -c "safe.directory=$source_root" -C "$source_root" archive "$commit" | tar -x -C "$release_dir"
chown -R "$run_user:$run_user" "$release_dir"

# tsx must see the decorator settings explicitly when loading NestJS sources.
cat > "$release_dir/tsconfig.runtime.json" <<'JSON'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
JSON
chown "$run_user:$run_user" "$release_dir/tsconfig.runtime.json"

run_app() {
  runuser -u "$run_user" -- env \
    NODE_ENV=production \
    DATABASE_URL="$DATABASE_URL" \
    SESSION_SECRET="$SESSION_SECRET" \
    WEB_ORIGIN="${WEB_ORIGIN:-http://127.0.0.1:$web_port}" \
    NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL:-}" \
    NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-}" \
    REDIS_URL="${REDIS_URL:-}" \
    npm "$@"
}

log "Installing dependencies"
cd "$release_dir"
run_app ci --include=dev
log "Applying database migrations"
run_app run db:migrate --workspace=@hnlms/api
log "Building workspaces"
run_app run build --workspaces --if-present

cat > "/etc/systemd/system/$app_name-api.service" <<UNIT
[Unit]
Description=HN-LMS API
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=$run_user
WorkingDirectory=$current_link
EnvironmentFile=$env_file
# Internal workspace packages expose TypeScript source entrypoints.
Environment=TSX_TSCONFIG_PATH=$current_link/tsconfig.runtime.json
ExecStart=$current_link/node_modules/.bin/tsx --tsconfig $current_link/tsconfig.runtime.json $current_link/apps/api/src/main.ts
Restart=on-failure
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
UNIT

cat > "/etc/systemd/system/$app_name-web.service" <<UNIT
[Unit]
Description=HN-LMS Web
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=$run_user
WorkingDirectory=$current_link
EnvironmentFile=$env_file
Environment=PORT=$web_port
ExecStart=$(command -v npm) run start --workspace=@hnlms/web -- -p $web_port
Restart=on-failure
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
UNIT

cat > "/etc/systemd/system/$app_name-worker.service" <<UNIT
[Unit]
Description=HN-LMS Worker
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=$run_user
WorkingDirectory=$current_link
EnvironmentFile=$env_file
ExecStart=$(command -v node) worker/dist/main.js
Restart=on-failure
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
UNIT

chown -R "$run_user:$run_user" "$release_dir"
previous_release="$(readlink -f "$current_link" 2>/dev/null || true)"
if [[ -n "$previous_release" && "$previous_release" == "$releases_root/"* ]]; then
  install -d -o root -g root -m 0755 /var/lib/hn-lms
  printf '%s\n' "$previous_release" > /var/lib/hn-lms/previous-release
  chmod 0600 /var/lib/hn-lms/previous-release
fi
ln -sfn "$release_dir" "$current_link"
chown -h "$run_user:$run_user" "$current_link"
systemctl daemon-reload
systemctl enable "$app_name-api.service" "$app_name-web.service" "$app_name-worker.service"
systemctl restart "$app_name-api.service" "$app_name-web.service" "$app_name-worker.service"

api_health_url="${HN_LMS_HEALTH_URL:-http://127.0.0.1:$api_port/health}"
web_health_url="${HN_LMS_WEB_URL:-http://127.0.0.1:$web_port/}"
for attempt in {1..30}; do
  if curl --fail --silent --show-error "$api_health_url" >/dev/null && curl --fail --silent --show-error "$web_health_url" >/dev/null; then
    log "Deployment successful: $release_id"
    log "API: $api_health_url"
    log "Web: $web_health_url"
    exit 0
  fi
  sleep 2
done

systemctl --no-pager --full status "$app_name-api.service" "$app_name-web.service" "$app_name-worker.service" || true
fail "Health check failed; current release is $release_id"

