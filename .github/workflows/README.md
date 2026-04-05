# .github/workflows/

## deploy.yml

Deploys the `frontend/` directory to GitHub Pages on every push to `master`. No build step — `index.html` is fully self-contained so the directory is uploaded as-is.

**What each step does:**

`actions/checkout@v4` — checks out the repo so the workflow can see the files.

`actions/configure-pages@v4` — sets up the GitHub Pages environment and validates that Pages is enabled for the repo.

`actions/upload-pages-artifact@v3` — packages the `frontend/` directory into a Pages artifact. The `path: frontend/` argument means only that folder is published, not the whole repo.

`actions/deploy-pages@v4` — deploys the artifact and outputs the final URL.

**Permissions:**

`pages: write` and `id-token: write` are required for the deploy step to authenticate with GitHub Pages using OIDC. `contents: read` lets the checkout step access the repo.

**Concurrency:**

`cancel-in-progress: true` means if two pushes happen in quick succession, the older deployment is cancelled so only the latest commit ends up live.

**Result:**

The app is available at `https://iamvishalsehgal.github.io/Planty`. Only the frontend runs here — the backend ETL pipeline and analytics are not available from this URL. For full functionality use the Render URL instead.
