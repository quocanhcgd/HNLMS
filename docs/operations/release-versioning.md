# Release and Versioning Convention

HN-LMS uses Semantic Versioning for deployable releases: `MAJOR.MINOR.PATCH`. A major release may remove or change a public API contract, a minor release adds backward-compatible functionality, and a patch release fixes backward-compatible defects or security issues.

Every release is built from a protected commit by `.github/workflows/ci.yml`, packaged as an immutable artifact named `hn-lms-<git-sha>.tgz`, and accompanied by a SHA-256 sidecar. A release tag uses `vMAJOR.MINOR.PATCH` and points to the exact commit used to build the artifact.

Database changes follow expand/migrate/contract. Destructive changes require a prior backup, rollback note and migration compatibility evidence. API contract changes require an updated spec/contract and a migration note when consumers are affected.

Release notes are generated from labels configured in `.github/release.yml`. Use `breaking-change`, `feature`, `bug`, `security`, `dependencies` and `skip-changelog` consistently. Never include credentials, private learner data or unredacted incident details in release notes.
