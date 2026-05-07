# next-cloudrun-starter

A Next.js 14 starter that deploys to Google Cloud Run on every push to `main`. Use it as the starting point for any prototype that needs a live URL.

## What you get

- Next.js 14.2.3 + React 18, TypeScript strict mode
- One placeholder page (`app/page.tsx`) that renders `process.env.PROTO_NAME`
- Multi-stage Dockerfile producing a Next.js standalone image
- A GitHub Actions workflow (`.github/workflows/deploy.yml`) that builds and deploys on push to `main`

## Lifecycle

1. **One-time per GCP project:** [set up GCP](#1-one-time-gcp-setup) — service account, Artifact Registry repo, JSON key. The same setup is reused for every prototype.
2. **Once on this template:** [mark it as a template repo](#2-mark-this-repo-as-a-template).
3. **Per prototype:** [spawn a new repo from the template, set secrets, push](#3-create-a-new-prototype).

---

## 1. One-time GCP setup

Run these once per GCP project. The service account + key produced here can be reused for every prototype that deploys into that project.

```bash
PROJECT_ID=<your-gcp-project>
REGION=europe-west2
SA_NAME=proto-deployer
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

# Enable the APIs the workflow uses
gcloud services enable run.googleapis.com artifactregistry.googleapis.com \
  --project $PROJECT_ID

# Create the Artifact Registry Docker repo (name 'prototypes' is what the workflow expects)
gcloud artifacts repositories create prototypes \
  --repository-format=docker \
  --location=$REGION \
  --project $PROJECT_ID

# Service account that GitHub Actions will authenticate as
gcloud iam service-accounts create $SA_NAME \
  --display-name="Prototype deployer" \
  --project $PROJECT_ID

# Grant the three roles the workflow needs
for role in roles/run.admin roles/artifactregistry.writer roles/iam.serviceAccountUser; do
  gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SA_EMAIL" \
    --role="$role"
done

# Create + download the JSON key (becomes the GCP_SA_KEY secret on each prototype repo)
gcloud iam service-accounts keys create ./gcp-sa-key.json \
  --iam-account=$SA_EMAIL
```

Keep `gcp-sa-key.json` somewhere safe — it's a long-lived credential. Don't commit it, don't email it. (Upgrade path: replace JSON keys with Workload Identity Federation when prototypes graduate beyond experiments.)

To use a different region or Artifact Registry repo name, edit the `env:` block at the top of `.github/workflows/deploy.yml` and substitute those values here.

## 2. Mark this repo as a template

So that "Use this template" appears on the repo page:

```bash
gh api repos/<owner>/next-cloudrun-starter -X PATCH -f is_template=true
```

Or in the GitHub UI: **Settings → General → Template repository**.

## 3. Create a new prototype

Every time you start a new prototype:

```bash
gh repo create <owner>/<prototype-name> \
  --template <owner>/next-cloudrun-starter \
  --public --clone

cd <prototype-name>

# Set deploy secrets on the new repo
gh secret set GCP_PROJECT_ID --body "<your-gcp-project>"
gh secret set GCP_SA_KEY < /path/to/gcp-sa-key.json

# First deploy: any commit to main triggers it
git commit --allow-empty -m "trigger deploy" && git push
```

Watch the **Actions** tab. The workflow builds the image, pushes it to Artifact Registry, deploys it to Cloud Run as service `<prototype-name>`, and prints the live URL as a workflow notice.

Subsequent pushes to `main` re-deploy automatically.

The workflow's **Allow public access** step grants `allUsers` the `roles/run.invoker` permission so the `*.run.app` URL is reachable. (`--allow-unauthenticated` on the deploy step does the same thing, but some org policies silently strip it — the explicit step is belt-and-braces.) If you front prototypes with a load balancer instead — Cloud Run private + LB-authenticated — delete that step and grant `roles/run.invoker` to the LB's service account.

## Service naming

Service name = the GitHub repo name. Repo `acme` → Cloud Run service `acme`. The workflow derives this automatically from `${{ github.repository }}` — there's no config to edit.

The page reads the prototype name from `process.env.PROTO_NAME`, which the workflow sets to the repo name on each deploy. Use it for branding or downstream config in your prototype.

## Will multiple prototypes collide?

No, with one footnote. Each prototype from the template is:

- Its own GitHub repo (no shared history with the template or other prototypes)
- Its own Cloud Run service (named after the new repo)
- Its own image path in Artifact Registry (`prototypes/<repo>:<sha>`)

So two prototypes `acme` and `bar` deploy independently and never touch each other.

**Footnote:** if two people both create a repo with the *same name* (e.g. both call it `demo`) and both deploy to the *same GCP project*, the second push overwrites the first's Cloud Run service `demo`. Pick unique names. If multiple developers ever share a project, namespace by owner in the workflow:

```yaml
NAME="${GITHUB_REPOSITORY_OWNER}-${GITHUB_REPOSITORY#*/}"
```

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
