#!/usr/bin/env bash
set -euo pipefail
npm run typecheck --workspace=@hnlms/api
npm run typecheck --workspace=@hnlms/worker
npm run typecheck --workspace=@hnlms/web
npm test -- --run
echo "HN LMS migration/release preflight passed"
