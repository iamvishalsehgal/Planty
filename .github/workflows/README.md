# .github/workflows/

This folder handles automatic deployment. Whenever a change is pushed to the main branch, the app is automatically published to GitHub Pages — no manual steps needed.

---

## What happens

Every time code is pushed to `master`, GitHub runs `deploy.yml` automatically. It takes the `frontend/` folder and publishes it live at `https://iamvishalsehgal.github.io/Planty`.

The whole thing takes about a minute. You can watch it happen under the **Actions** tab on GitHub.

---

For the technical breakdown, see [docs.md](docs.md).
