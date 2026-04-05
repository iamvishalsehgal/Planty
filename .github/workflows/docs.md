# .github/workflows/ — Technical Reference

## deploy.yml

Deploys the `frontend/` directory to GitHub Pages on push to `master`. No build step — `index.html` is fully self-contained so the directory is uploaded as-is using the Pages artifact API.

---

## Trigger

```yaml
on:
  push:
    branches: [master]
```

Runs on every push to `master`. Not triggered by PRs or pushes to other branches.

---

## Permissions

```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

`pages: write` + `id-token: write` — required for OIDC-based authentication with the GitHub Pages deployment API. Without these, `actions/deploy-pages` fails with a 403.

`contents: read` — allows `actions/checkout` to clone the repo.

---

## Concurrency

```yaml
concurrency:
  group: pages
  cancel-in-progress: true
```

If two pushes happen in quick succession, the older in-flight deployment is cancelled and only the latest commit is deployed. Without this, pushes can queue up and deploy stale code out of order.

---

## Steps

**`actions/checkout@v4`** — Clones the repo at the commit that triggered the workflow.

**`actions/configure-pages@v4`** — Validates that GitHub Pages is enabled for the repo and sets output variables used by the deploy step. If Pages is not enabled in repo settings, this step fails with a descriptive error.

**`actions/upload-pages-artifact@v3`** — Packages the directory at `path: frontend/` into a Pages artifact. Only the `frontend/` folder is included — the `backend/`, `README.md`, and other repo files are not published.

**`actions/deploy-pages@v4`** — Deploys the artifact. Outputs `page_url` which is surfaced in the GitHub environment UI as the deployment URL.

---

## Environment

```yaml
environment:
  name: github-pages
  url: ${{ steps.deployment.outputs.page_url }}
```

Links the workflow run to the `github-pages` environment in GitHub, which shows the live URL in the repo's Deployments sidebar and tracks deployment history.

---

## Result

Published at: `https://iamvishalsehgal.github.io/Planty`

Only the frontend runs at this URL. The backend ETL pipeline, analytics endpoints, and SQLite database are not available — those require the Render deployment.
