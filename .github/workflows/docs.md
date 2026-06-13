# .github/workflows/ — Technical Reference

## deploy.yml

Deploy `frontend/` to GitHub Pages on push to `master`. No build step — `index.html` self-contained, directory uploaded as-is via Pages artifact API.

---

## Trigger

```yaml
on:
  push:
    branches: [master]
```

Runs every push to `master`. Not PRs or other branches.

---

## Permissions

```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

`pages: write` + `id-token: write` — required for OIDC auth with Pages deployment API. Without → `actions/deploy-pages` fails 403.

`contents: read` — lets `actions/checkout` clone repo.

---

## Concurrency

```yaml
concurrency:
  group: pages
  cancel-in-progress: true
```

Two pushes rapid → older inflight deploy cancelled, only latest commit deploys. Without → pushes queue, stale code deploys out of order.

---

## Steps

**`actions/checkout@v4`** — Clone repo at triggering commit.

**`actions/configure-pages@v4`** — Validate Pages enabled for repo, set output vars for deploy step. Pages disabled → step fails with descriptive error.

**`actions/upload-pages-artifact@v3`** — Package `path: frontend/` into Pages artifact. Only `frontend/` included — `backend/`, `README.md`, other files excluded.

**`actions/deploy-pages@v4`** — Deploy artifact. Output `page_url` surfaced in GitHub environment UI as deployment URL.

---

## Environment

```yaml
environment:
  name: github-pages
  url: ${{ steps.deployment.outputs.page_url }}
```

Links workflow run to `github-pages` environment → shows live URL in repo's Deployments sidebar, tracks deployment history.

---

## Result

Published at: `https://iamvishalsehgal.github.io/Planty`

Only frontend runs here. Backend ETL pipeline, analytics endpoints, SQLite DB unavailable — need Render deployment for those.