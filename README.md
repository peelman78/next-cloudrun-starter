# MIRACL prototype template

A Next.js 14 starter that deploys to Google Cloud Run as `<repo-name>-miracl` on every push to `main`. Use it as the starting point for any MIRACL team prototype that needs a live URL.

## What you get

- Next.js 14.2.3 + React 18, TypeScript strict mode
- One placeholder page (`app/page.tsx`) that renders the prototype name pulled from a `PROTO_NAME` env var
- Multi-stage Dockerfile producing a Next.js standalone image
- A GitHub Actions workflow (`.github/workflows/deploy.yml`) that builds and deploys on push to `main`

## Use as a template

1. **GitHub:** click **Use this template** → **Create a new repository** under whichever GitHub owner has access (your user or your org). Name it after the prototype, e.g. `acme`. Cloud Run names must match `[a-z]([-a-z0-9]{0,48}[a-z0-9])?`, so keep the repo name lowercase.
2. **Repo secrets** (Settings → Secrets and variables → Actions):
   - `GCP_PROJECT_ID` — the GCP project you're deploying into
   - `GCP_SA_KEY` — JSON key for a service account with `roles/run.admin`, `roles/artifactregistry.writer`, `roles/iam.serviceAccountUser`
3. **Push** any change to `main` (or trigger the workflow from the Actions tab). The first deploy creates the Cloud Run service `acme-miracl` and prints its URL in the workflow notices.

## Service naming

Service name = `<github-repo-name>-miracl`. Repo `acme` → service `acme-miracl`. The workflow derives this automatically from `${{ github.repository }}` — there's no config to edit.

The page reads the bare prototype name from `process.env.PROTO_NAME`, which the workflow sets to the repo name on each deploy. Use it for branding or downstream config in your prototype.

## GCP prerequisites (one-time, per project)

- Artifact Registry Docker repo named `prototypes` in the deploy region (default: `europe-west2`).
- Service account with the three roles above; download its JSON key and paste it as the `GCP_SA_KEY` secret.

To change the region or repo name, edit the `env:` block at the top of `.github/workflows/deploy.yml`.

## Local dev

```bash
npm install
npm run dev          # http://localhost:3000
```

To preview the production build (matches what runs on Cloud Run):

```bash
docker build -t proto-local .
docker run --rm -p 8080:8080 -e PROTO_NAME=local proto-local
# http://localhost:8080
```

## Conventions

- One prototype per repo. Don't park multiple prototypes in subfolders.
- Read `PROTO_NAME` for any naming/branding logic; don't hardcode.
- The shell isn't precious — replace `app/page.tsx` with your real prototype as soon as you start.
