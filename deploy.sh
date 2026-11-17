#!/bin/bash
set -e

###############################################
# Usage: ./deploy.sh [--branch <branch>] [--env prod]
#
# Defaults to staging. Use --env prod for production.
# Production always deploys from master branch.
###############################################

ENV="stg"
BRANCH=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env)
      ENV="$2"
      shift 2
      ;;
    --branch)
      BRANCH="$2"
      shift 2
      ;;
    *)
      echo "❌ Unknown argument: $1"
      echo "Usage: ./deploy.sh [--branch <branch>] [--env prod]"
      exit 1
      ;;
  esac
done

if [[ "$ENV" != "stg" && "$ENV" != "prod" ]]; then
  echo "❌ Error: --env must be 'stg' or 'prod'"
  exit 1
fi

# CONFIG BASED ON ENV
if [[ "$ENV" == "prod" ]]; then
  BRANCH="master"
  DEPLOY_PATH="/var/www/formstr.app/"
  VERCEL_ENV="production"
else
  DEPLOY_PATH="/var/www/forms.stg.formstr.app/"
  VERCEL_ENV="staging"
fi

echo "🚀 Deploying to $ENV environment"
echo "→ Branch: ${BRANCH:-<current>}"
echo "→ Deploy path: $DEPLOY_PATH"
echo ""

###############################################
# Go to repo and update
###############################################

git fetch origin

if [[ -n "$BRANCH" ]]; then
  echo "📦 Checking out branch $BRANCH"
  git checkout "$BRANCH"
  git pull origin "$BRANCH"
else
  echo "📦 Pulling latest on current branch"
  git pull
fi

###############################################
# Install dependencies + build
###############################################
echo "📦 Installing dependencies..."
yarn install --frozen-lockfile

echo "🏗 Building web app..."
export REACT_APP_VERCEL_ENV="$VERCEL_ENV"
yarn workspace @formstr/web-app build

###############################################
# Deploy files
###############################################
echo "📂 Syncing build to $DEPLOY_PATH"
sudo rsync -av --delete \
  ./packages/formstr-app/build/ \
  "$DEPLOY_PATH"

###############################################
# Reload nginx
###############################################
echo "🔄 Reloading nginx..."
sudo systemctl reload nginx

echo "✅ Deployment to $ENV complete!"
