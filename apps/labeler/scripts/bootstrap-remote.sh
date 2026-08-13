#!/usr/bin/env bash
# Run after enabling R2 in the Cloudflare dashboard.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "Creating R2 bucket naturalens-data (ok if it already exists)…"
npx wrangler r2 bucket create naturalens-data || true

echo "Applying remote D1 migrations…"
npm run db:migrate

if [[ -z "${TRAIN_TOKEN:-}" ]]; then
  TRAIN_TOKEN="$(openssl rand -hex 24)"
  echo "Generated TRAIN_TOKEN (save this for Colab Secrets): $TRAIN_TOKEN"
fi
echo "$TRAIN_TOKEN" | npx wrangler secret put TRAIN_TOKEN

echo "Deploying Worker…"
npm run deploy

echo
echo "Next:"
echo "  1. Workers → naturalens-labeler → Settings → Domains & Routes → Enable Cloudflare Access"
echo "  2. Set TEAM_DOMAIN + POLICY_AUD secrets, set AUTH_MODE=required, redeploy"
echo "  3. Create an R2 S3 API token and put keys in Colab Secrets"
echo "  4. Seed: LABELER_URL=https://naturalens-labeler.<subdomain>.workers.dev python ../../models/tools/sync_r2.py --push"
echo "  5. Open the app, create a run, train in Colab"
