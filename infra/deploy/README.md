# Ubuntu deployment

\`ubuntu-deploy.sh\` deploys the selected GitHub commit to a native Ubuntu host. It does not use Docker and it does not store credentials in the repository.

## One-time server setup

Install Node.js 20.x, npm, Git, curl and PostgreSQL client tools. Create the production environment file:

\`\`\`bash
sudo install -d -m 0755 /etc/hn-lms
sudo install -m 0600 /dev/null /etc/hn-lms/hn-lms.env
sudoedit /etc/hn-lms/hn-lms.env
\`\`\`

At minimum, set:

\`\`\`dotenv
NODE_ENV=production
API_PORT=4000
WEB_ORIGIN=https://your-domain.example
NEXT_PUBLIC_SITE_URL=https://your-domain.example
DATABASE_URL=postgresql://...
SESSION_SECRET=replace-with-at-least-32-random-characters
\`\`\`

\`REDIS_URL\`, object storage settings and provider credentials should be added when those services are enabled. The database must be backed up before the first production migration.

## Deploy

From a checkout of this repository on the server:

\`\`\`bash
sudo HN_LMS_REF=main ./infra/deploy/ubuntu-deploy.sh
\`\`\`

Optional variables:

\`\`\`bash
sudo HN_LMS_REF=1525e55 \\
  HN_LMS_REPO_URL=https://github.com/quocanhcgd/HNLMS.git \\
  HN_LMS_ENV_FILE=/etc/hn-lms/hn-lms.env \\
  ./infra/deploy/ubuntu-deploy.sh
\`\`\`

The script fetches the commit, creates \`/opt/hn-lms/releases/<sha>\`, installs dependencies, runs migrations, builds all workspaces, updates \`/opt/hn-lms/current\`, and restarts three systemd services:

- \`hn-lms-api.service\`
- \`hn-lms-web.service\`
- \`hn-lms-worker.service\`

Put Nginx or another TLS reverse proxy in front of web port \`3000\`. API health is on port \`4000\`. The script deliberately does not create a domain-specific Nginx configuration.

## Verify and rollback

\`\`\`bash
systemctl status hn-lms-api hn-lms-web hn-lms-worker
curl http://127.0.0.1:4000/health
curl -I http://127.0.0.1:3000/
\`\`\`

Keep the previous release directory for rollback. The existing \`infra/release-scripts/rollback.sh\` can switch back when \`/var/lib/hn-lms/previous-release\` has been recorded by the release workflow. For a manual emergency rollback, repoint \`/opt/hn-lms/current\` to the previous release and restart the three services.

