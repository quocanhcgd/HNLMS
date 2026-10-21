# Branch Protection Checklist

Apply these settings to `main` (and any release branch) in repository settings. This file is the reviewable source of truth; the GitHub API remains the enforcement point.

## Required settings

- Require a pull request before merging, with at least one approving review and dismissal of stale approvals after new commits.
- Require CODEOWNERS review for owned paths and require conversation resolution.
- Require the `Quality gates` and `Build release artifact` checks from `.github/workflows/ci.yml`.
- Require branches to be up to date, block force-push and branch deletion, and restrict direct pushes to maintainers.
- Require signed commits for protected release branches when the organization has signing keys configured.
- Allow squash or rebase merges only; delete merged branches automatically.

## Change control

Review this checklist quarterly and after a repository transfer, CI workflow rename or permission change. A change to branch protection itself requires a recorded administrator review and an audit event/screenshot in the operations change record.
