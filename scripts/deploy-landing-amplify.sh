#!/usr/bin/env bash
set -euo pipefail

APP_ID="${AMPLIFY_LANDING_APP_ID:-}"
BRANCH="${AMPLIFY_LANDING_BRANCH:-main}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ARTIFACTS_DIR="$ROOT/apps/landing/.amplify-hosting"
ZIP_FILE="$ROOT/apps/landing/.amplify-hosting.zip"

if [[ -z "$APP_ID" ]]; then
  echo "Defina AMPLIFY_LANDING_APP_ID com o app ID do Amplify da landing."
  exit 1
fi

export VITE_APP_URL="${VITE_APP_URL:-https://app.gestaobem.com}"
export VITE_LANDING_URL="${VITE_LANDING_URL:-https://gestaobem.com}"
export VITE_WHATSAPP_PHONE="${VITE_WHATSAPP_PHONE:-5521987962324}"

echo "→ Instalando dependências..."
cd "$ROOT"
corepack enable
pnpm install --frozen-lockfile

echo "→ Build da landing..."
pnpm --filter @agenda-pro/landing build

if [[ ! -d "$ARTIFACTS_DIR" ]]; then
  echo "Artefatos não encontrados em $ARTIFACTS_DIR"
  exit 1
fi

echo "→ Empacotando artefatos..."
rm -f "$ZIP_FILE"
(cd "$ARTIFACTS_DIR" && zip -qr "$ZIP_FILE" .)

echo "→ Criando deployment no Amplify (app: $APP_ID, branch: $BRANCH)..."
DEPLOY_JSON=$(aws amplify create-deployment \
  --app-id "$APP_ID" \
  --branch-name "$BRANCH" \
  --output json)

JOB_ID=$(echo "$DEPLOY_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)['jobId'])")
ZIP_URL=$(echo "$DEPLOY_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)['zipUploadUrl'])")

echo "→ Enviando pacote (job: $JOB_ID)..."
curl --silent --show-error --upload-file "$ZIP_FILE" "$ZIP_URL"

echo "→ Iniciando deployment..."
aws amplify start-deployment \
  --app-id "$APP_ID" \
  --branch-name "$BRANCH" \
  --job-id "$JOB_ID" \
  --output json

echo "✓ Deploy iniciado. Acompanhe no console Amplify ou com:"
echo "  aws amplify get-job --app-id $APP_ID --branch-name $BRANCH --job-id $JOB_ID"