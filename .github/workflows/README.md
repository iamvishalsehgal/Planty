# GitHub Actions Workflows

## `deploy.yml` — Deploy to GitHub Pages

Deploys the `frontend/` directory to GitHub Pages whenever code is pushed to the `master` branch.

### What it does

1. Checks out the repository
2. Configures the GitHub Pages environment
3. Uploads the `frontend/` folder as the Pages artifact — the entire directory, including `index.html`, `vite.config.ts`, and `package.json`
4. Deploys the artifact to GitHub Pages

No build step runs. The frontend is a self-contained `index.html` file that works without compilation, so it's published as-is.

### When it triggers

```yaml
on:
  push:
    branches: [master]
```

Every push to `master` starts the workflow. If a deployment is already in progress when a new push arrives, the running deployment is cancelled and replaced by the new one (`cancel-in-progress: true`).

### Required permissions

```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

These are set at the workflow level. `pages: write` and `id-token: write` are required by the `actions/deploy-pages` action to authenticate with the GitHub Pages API using OIDC.

### Setting up GitHub Pages in your repo

1. Go to your repository on GitHub
2. Click **Settings** → **Pages** (in the left sidebar)
3. Under **Source**, select **GitHub Actions**
4. Save

That's all. The next push to `master` will trigger the workflow and deploy to Pages. You don't need to configure a branch or folder — the workflow handles that through the `actions/upload-pages-artifact` and `actions/deploy-pages` actions.

### The resulting URL

GitHub Pages URLs follow the pattern:

```
https://<username>.github.io/<repository-name>/
```

For example, if your GitHub username is `johndoe` and the repo is named `planty`, the URL would be:

```
https://johndoe.github.io/planty/
```

The exact URL is also shown as an output of the deployment step (`steps.deployment.outputs.page_url`) and displayed in the Actions run summary after each successful deploy.

### Note on the backend

GitHub Pages only serves static files. The `/api/*` routes are not available from the GitHub Pages URL — those are handled by the Render backend. If the frontend is accessed via GitHub Pages and the backend is not reachable, all API calls will fail silently. The frontend continues to work fully from localStorage regardless.
