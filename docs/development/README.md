# Development Onboarding

1. Install Node 20.12.2 and npm.
2. Run `npm install` at the repository root.
3. Copy `.env.example` to a local environment file and replace local-only values.
4. Start PostgreSQL, Redis and S3-compatible storage.
5. Run `npm run typecheck`.
6. Run `npm run dev` for the web prototype.

API and worker are skeletons until their production dependencies are selected in T161-T167.
