Deploy instructions for Looton backend

This repository contains a monorepo with frontend and backend under `looton/`.
The goal of these artifacts is to let you push the backend folder contents to a separate GitHub repository and configure a CI workflow to build and publish a Docker image.

1) Quick manual push script (PowerShell)

- File: `scripts/push-backend.ps1`
- Purpose: create a temporary git repo with the contents of `looton/backend` and push to a specified remote. This is a one-shot snapshot push; it does not preserve original Git history.

Usage example (PowerShell):

```powershell
$env:GH_TOKEN = "ghp_xxx..." # set your PAT with repo:public_repo scope (or repo)
.
\scripts\push-backend.ps1 -RemoteUrl "https://github.com/NexusDevsystem/Looton-backend.git" -Branch "main" -TokenEnvVar "GH_TOKEN"
```

Security: avoid embedding tokens in command history. Prefer setting environment variables or using Git credential helpers.

2) GitHub Actions workflow to build and publish Docker image

- File: `.github/workflows/publish-backend-image.yml`
- This workflow runs when changes are pushed under `looton/backend` and will build the Docker image and push to GitHub Container Registry under the org's account (ghcr.io/<owner>/looton-backend).
- It uses `GITHUB_TOKEN` for authentication; if you want to publish under another account or set different visibility, adjust the workflow and repository permissions.

3) Next steps / recommendations

- If you want to preserve history when migrating, perform a subtree split:
  git subtree split --prefix=looton/backend -b backend-only
  Then push that branch to the remote repo and preserve history.

- If you prefer me to create a full `git push` flow that preserves commit history, I can add a script that uses `git filter-repo` or `subtree` but that requires careful coordination and access.

- Make sure the target GitHub repo exists and you have push rights.

If you'd like, I can:
- Create a stub release tag and GitHub release via the workflow (needs extra secrets), or
- Implement an alternative pipeline that deploys to a hosting provider (DigitalOcean, AWS ECS, etc.).

