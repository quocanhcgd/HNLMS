# Ubuntu deployment

This directory contains a native Ubuntu deployment for HN-LMS. It does not use
Docker and it does not store credentials in the repository.

## One-command installation (recommended)

For a clean Ubuntu server, run this single installer as `root`:

```bash
curl --fail --silent --show-error --location \
  https://raw.githubusercontent.com/quocanhcgd/HNLMS/main/infra/deploy/ubuntu-install.sh \
  --output /tmp/hn-lms-install.sh
bash /tmp/hn-lms-install.sh
```

The installer installs the runtime, asks for the public web URL, public API URL
and remote PostgreSQL URL, creates the protected environment file, runs the
database migration, builds the workspaces and starts all systemd services. It
does not install Nginx or create certificates. Configure Nginx Proxy Manager to
forward the web hostname to `SERVER_IP:3000` and the API hostname to
`SERVER_IP:4000`.

## 1. Bootstrap a basic Ubuntu server

`ubuntu-bootstrap.sh` installs the host dependencies required by the release
script:

- Node.js 20.x and npm
- Git, curl and CA certificates
- build tools, Python and `pkg-config` for npm native modules
- Nginx
- PostgreSQL client tools
- OpenSSL and unzip

It also creates the `hnlms` service account, `/opt/hn-lms` directories and the
protected environment file `/etc/hn-lms/hn-lms.env`. It intentionally does not
install a PostgreSQL server: production uses the remote `DATABASE_URL` supplied
by the operator.

If the repository is already checked out:

```bash
sudo ./infra/deploy/ubuntu-bootstrap.sh
```

On a completely bare server, download the bootstrap script first. The first
two commands install only the tools needed to download it:

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl
curl --fail --silent --show-error --location \
  https://raw.githubusercontent.com/quocanhcgd/HNLMS/main/infra/deploy/ubuntu-bootstrap.sh \
  --output /tmp/hn-lms-bootstrap.sh
sudo bash /tmp/hn-lms-bootstrap.sh
```

## 2. Configure production environment

Create or edit the protected environment file:

```bash
sudoedit /etc/hn-lms/hn-lms.env
```

At minimum, set:

```dotenv
NODE_ENV=production
API_PORT=4000
WEB_ORIGIN=https://your-domain.example
NEXT_PUBLIC_SITE_URL=https://your-domain.example
NEXT_PUBLIC_API_URL=https://api.your-domain.example
DATABASE_URL=postgresql://REMOTE_DATABASE_CONNECTION_STRING
SESSION_SECRET=replace-with-at-least-32-random-characters
```

`REDIS_URL`, object storage settings and provider credentials should be added
when those services are enabled. Back up the remote database before the first
production migration. `NEXT_PUBLIC_API_URL` must be the public HTTPS origin of
the API; it is embedded into the web build.

## 3. Deploy the application

Clone the repository and run the release script:

```bash
git clone https://github.com/quocanhcgd/HNLMS.git /opt/hn-lms/source
cd /opt/hn-lms/source
sudo HN_LMS_REF=main ./infra/deploy/ubuntu-deploy.sh
```

The script fetches the selected commit, creates an immutable release under
`/opt/hn-lms/releases/<sha>`, installs dependencies, runs migrations, builds
all workspaces, updates `/opt/hn-lms/current`, and restarts:

- `hn-lms-api.service`
- `hn-lms-web.service`
- `hn-lms-worker.service`

Put Nginx or another TLS reverse proxy in front of web port `3000`. API health
is on port `4000`; the deployment script deliberately does not create a
domain-specific Nginx configuration.

Optional deployment variables include `HN_LMS_REF`, `HN_LMS_REPO_URL`,
`HN_LMS_ENV_FILE`, `HN_LMS_APP_ROOT`, `HN_LMS_USER`, `HN_LMS_WEB_PORT` and
`HN_LMS_API_PORT`.

## 4. Verify and roll back

```bash
systemctl status hn-lms-api hn-lms-web hn-lms-worker
curl http://127.0.0.1:4000/health
curl -I http://127.0.0.1:3000/
```

The release script records the previous release in
`/var/lib/hn-lms/previous-release`. Keep that directory available for rollback;
`infra/release-scripts/rollback.sh` can switch back to it and restart the
services.
