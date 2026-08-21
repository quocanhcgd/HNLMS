# Project Status Contract

`project-status.json` is the live status contract consumed by `task-dashboard.html`.

At every implementation task, update it with:

- `updatedAt` in Asia/Ho_Chi_Minh time.
- `currentTask.id`, title, status (`next|in_progress|blocked|completed`) and percent.
- `currentTask.activity` as one short sentence describing what the agent is doing now.
- `nextTask`.
- `overall` and `phases` from `tasks.md`.
- `blockers` with severity.
- `lastCommit` after commit.
- `ci` after GitHub Actions completes when known.

The dashboard polls this file every 15 seconds and also reloads when the file timestamp changes. This file is committed and published through GitHub Pages; it is not a replacement for task source-of-truth.
