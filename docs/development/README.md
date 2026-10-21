# Development Onboarding

## Prerequisites

- Node `20.19.x` and npm `10.5.x`; `.nvmrc` and `.node-version` are the source of truth.
- PostgreSQL, Redis and S3-compatible storage for integration flows. UI-only work can start without them.
- Use `npm ci` from the repository root. The repository intentionally has one npm lockfile and no pnpm/yarn workspace.

## Daily commands

| Goal | Command |
| --- | --- |
| Install reproducibly | `npm ci` |
| Start web | `npm run dev:web` |
| Start API | `npm run dev:api` |
| Start worker | `npm run dev:worker` |
| Run all tests | `npm test` |
| Run focused tests | `node_modules/.bin/vitest run path/to/test.ts` |
| Typecheck all packages | `npm run typecheck` |
| Build web | `npm run build` |
| Generate task dashboard | `npm run status:generate` |

## Workspace map

- `apps/web`: Next.js App Router UI and role-based portals.
- `apps/api`: NestJS modular API, Drizzle schema and domain services.
- `worker`: asynchronous jobs for media, reporting and integrations.
- `packages/*`: shared contracts, authorization, UI and adapters.
- `specs/001-lms-multi-branch`: business rules, contracts and source task list.
- `docs/project-status.json`: machine-readable progress; `docs/task-dashboard.html`: browser view.

## Environment

Copy `.env.example` to a local-only env file. Never commit secrets, real learner data, uploaded media or build output. API listens on `4000`; web listens on `3100`.

## Demo Login

Open `http://localhost:3100/login` to test the role portals. The page provides one-click account selection for all 17 seeded roles (operations, admission, marketing, academic, finance, HR, teaching, student and parent). Demo accounts are local-development fixtures only and share the password `DemoAccess@2026!`; they must never be enabled in production. Selecting an account fills the form, and a successful sign-in stores a browser-local demo session before routing to that role's home page.

## Change workflow

Read the relevant spec and task, inspect `git status`, implement the smallest complete slice, run focused tests, then full tests/typecheck. Update the task source and dashboard only after evidence exists. For a new requirement, analyze every affected role and workflow before changing UI or contracts.
