#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOY_DIR="$(mktemp -d)"
REMOTE_URL="$(git -C "$ROOT_DIR" remote get-url origin)"

cleanup() {
  rm -rf "$DEPLOY_DIR"
}

trap cleanup EXIT

cd "$ROOT_DIR"

npm run build
cp dist/index.html dist/404.html
touch dist/.nojekyll

git init "$DEPLOY_DIR" >/dev/null
git -C "$DEPLOY_DIR" checkout -b gh-pages >/dev/null
cp -R dist/. "$DEPLOY_DIR"/

git -C "$DEPLOY_DIR" add .
git -C "$DEPLOY_DIR" commit -m "Deploy GitHub Pages" >/dev/null
git -C "$DEPLOY_DIR" remote add origin "$REMOTE_URL"
git -C "$DEPLOY_DIR" push --force origin gh-pages
