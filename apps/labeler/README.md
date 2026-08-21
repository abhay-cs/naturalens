# NaturaLens Labeler

Internal upload / label / train-review app for polar bear photos.

- **Worker**: `naturalens-labeler`
- **Live**: https://skim.naturalens.ca (also `naturalens-labeler.<account>.workers.dev`)
- **R2**: `naturalens-data` (images + run artifacts)
- **D1**: `naturalens-labels` (boxes, review flags, run metadata)
- **Auth**: Cloudflare Access in front of the Worker; Colab uses a shared `TRAIN_TOKEN`

## Current setup status

Already done in this repo / account:

- D1 database `naturalens-labels` created and migrated (`2fe255ec-de36-4899-9443-9b651612773d`)
- Worker code, UI, Colab notebook, and `sync_r2.py` seed script
- Local end-to-end verified with `wrangler dev` (64 photos seeded, runs + TRAIN_TOKEN callback work)

Blocked on a one-time account click:

- **Enable R2** at [R2 overview](https://dash.cloudflare.com/7d91b2bbbfd2adb535a32f63e60bb204/r2/overview) (accept terms)
- Then run `./scripts/bootstrap-remote.sh` from `apps/labeler`

## One-time Cloudflare setup

### 1. Enable R2 (required once per account)

R2 must be turned on in the dashboard before the bucket can be created:

1. Open [R2 overview](https://dash.cloudflare.com/?to=/:account/r2/overview)
2. Accept the R2 terms / enable R2
3. Then run:

```bash
cd apps/labeler
npx wrangler r2 bucket create naturalens-data
```

D1 is already created:

- name: `naturalens-labels`
- id: `2fe255ec-de36-4899-9443-9b651612773d`

### 2. Install and migrate

```bash
cd apps/labeler
npm install
npm run db:migrate:local   # local wrangler state
npm run db:migrate         # remote D1
```

### 3. Set the Colab callback secret

```bash
npx wrangler secret put TRAIN_TOKEN
# use the same value in Colab Secrets as TRAIN_TOKEN
```

### 4. Deploy

```bash
npm run deploy
```

Custom domain: `https://skim.naturalens.ca` (Workers custom domain on `naturalens.ca`).
Workers.dev URL still works as a fallback.

### 5. Auth (email + PIN)

`AUTH_MODE=pin` gates the Skim UI behind email + PIN (4 tries, then a lockout). Allowlisted emails and attempt limits live in `wrangler.jsonc` vars. PIN and session HMAC secret are Worker secrets (never commit them):

```bash
npx wrangler secret put PIN_AUTH_PIN      # shared PIN
npx wrangler secret put PIN_AUTH_SECRET   # long random string for cookies
```

Colab still uses `Authorization: Bearer $TRAIN_TOKEN` for run status / quota report.

Optional: Cloudflare Access instead — set `AUTH_MODE=required` plus `TEAM_DOMAIN` / `POLICY_AUD` secrets.

### 6. R2 S3 API token for Colab

1. R2 → Manage R2 API Tokens → Create API token
2. Permission: **Object Read & Write**, scope to `naturalens-data`
3. Put these into Colab Secrets:
   - `R2_ACCOUNT_ID`
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`
   - `R2_BUCKET` = `naturalens-data`
   - `LABELER_URL` = `https://skim.naturalens.ca`
   - `TRAIN_TOKEN` = same as the Worker secret

## Local development

```bash
cd apps/labeler
npm install
npm run db:migrate:local
npm run dev
```

Open http://127.0.0.1:8787

Pages:

- `/` — Skim label editor
- `/upload.html` — upload + EXIF normalize
- `/runs.html` — create runs, review metrics / preds
- `/join-list` — waitlist emails from the landing page (same D1 as `naturalens-web`)

## Seed existing photos

After R2 is enabled and the Worker is deployed (or while using `wrangler dev` with remote bindings):

```bash
# from repo root, with AWS-compatible R2 credentials in the env
export R2_ACCOUNT_ID=...
export R2_ACCESS_KEY_ID=...
export R2_SECRET_ACCESS_KEY=...
export R2_BUCKET=naturalens-data
export LABELER_URL=https://naturalens-labeler.<subdomain>.workers.dev
# optional when Access is on: a service token or session cookie is not used;
# prefer running sync against wrangler dev, or use TRAIN_TOKEN for status only.
# For seeding, run against local wrangler with --remote D1/R2 after Access is optional.

python models/tools/sync_r2.py --push
```

`sync_r2.py --push` uploads normalized jpegs + thumbs to R2 and inserts D1 rows (via the Worker `/api/upload` + `/api/labels` when `LABELER_URL` is set, or directly with boto3 + D1 HTTP when configured).

## Training loop

1. Label / skim in the web UI
2. On Runs, click **Create training run** → copies an immutable `runs/<id>/manifest.json` to R2
3. Open `models/training/colab_train.ipynb` in Colab, set `RUN_ID`, Runtime → GPU (T4)
4. Run all cells — downloads the snapshot, trains SSDLite, uploads metrics/preds/tflite, callbacks status
5. Refresh Runs in the web UI to review mAP and click through failures to re-label

## Failure-proofing

| Risk | Mitigation |
| --- | --- |
| Two people edit the same photo | Optimistic `version` → 409 + refetch |
| Bad label overwrite | Append-only `label_history` |
| Duplicate uploads | Content-hash (`sha256`) primary key |
| Lost save on flaky network | Client retry queue in `localStorage` |
| Colab disconnect mid-run | Dual status: R2 `status.json` + Worker callback; UI merges both |
| EXIF rotation mismatch | Normalize orientation once at upload |

## Free-tier fit / hard internal caps

Cloudflare R2 free tier is **10 GB / 1M Class A / 10M Class B** per month. This app enforces **hard caps at 80%** of that so you cannot overage from this workflow:

| Meter | Free tier | Internal hard cap |
| --- | --- | --- |
| Storage | 10 GB | **8 GB** (`R2_CAP_STORAGE_BYTES`) |
| Class A (writes) | 1,000,000 / mo | **800,000** (`R2_CAP_CLASS_A_MONTH`) |
| Class B (reads) | 10,000,000 / mo | **8,000,000** (`R2_CAP_CLASS_B_MONTH`) |
| Max object | — | **20 MB** (`R2_CAP_MAX_OBJECT_BYTES`) |

When a cap is hit, uploads and new training runs return **HTTP 429** and the UI shows “R2 cap reached”. Colab also checks `/api/quota` and reports its S3 ops via `/api/quota/report` so Worker + Colab share one meter.

Ops that are especially expensive (listing runs with per-run R2 GETs) were removed — run list is D1-only.

64 photos ≈ 256 MB. R2 free tier is 10 GB storage / 1 M Class A ops. D1 and Workers free tiers are plenty for internal use. Cloudflare Access covers up to 50 users on the free Zero Trust plan.
