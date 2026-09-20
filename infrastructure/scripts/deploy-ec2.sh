#!/usr/bin/env bash
# Smart Space Booking - Automated Single-Instance EC2 Deployment Script
# Usage: ./infrastructure/scripts/deploy-ec2.sh <RELEASE_SHA>

set -euo pipefail

RELEASE_SHA=${1:-$(git rev-parse --short HEAD)}
ROOT_DIR="/opt/smart-space"
API_DIR="${ROOT_DIR}/api"
WEB_DIR="${ROOT_DIR}/web"

echo "=== Memulai Deployment Smart Space Booking [Release: ${RELEASE_SHA}] ==="

# 1. Pastikan direktori rilis tersedia
mkdir -p "${API_DIR}/releases/${RELEASE_SHA}"
mkdir -p "${WEB_DIR}/releases/${RELEASE_SHA}"

# 2. Build & Deploy Backend
echo "--> Mempersiapkan Backend API..."
cd Backendbooking
npm ci --silent
npm run build
npm prune --omit=dev --silent

cp -r dist "${API_DIR}/releases/${RELEASE_SHA}/"
cp -r prisma "${API_DIR}/releases/${RELEASE_SHA}/"
cp package.json "${API_DIR}/releases/${RELEASE_SHA}/"
cp package-lock.json "${API_DIR}/releases/${RELEASE_SHA}/"
cp -r node_modules "${API_DIR}/releases/${RELEASE_SHA}/"

# 3. Database Migration Deployment
echo "--> Menjalankan Database Migrations (npx prisma migrate deploy)..."
cd "${API_DIR}/releases/${RELEASE_SHA}"
npx prisma migrate deploy

# Update Backend Symlink
ln -sfn "${API_DIR}/releases/${RELEASE_SHA}" "${API_DIR}/current"
sudo systemctl restart smart-space-api

# 4. Build & Deploy Frontend Standalone
echo "--> Mempersiapkan Frontend Standalone..."
cd ../../../../Frontendbooking
npm ci --silent
npm run build

cp -r .next/standalone/* "${WEB_DIR}/releases/${RELEASE_SHA}/"
cp -r .next/static "${WEB_DIR}/releases/${RELEASE_SHA}/.next/"
cp -r public "${WEB_DIR}/releases/${RELEASE_SHA}/"

# Update Frontend Symlink
ln -sfn "${WEB_DIR}/releases/${RELEASE_SHA}" "${WEB_DIR}/current"
sudo systemctl restart smart-space-web

# 5. Reload Nginx
echo "--> Reloading Nginx Configuration..."
sudo nginx -t
sudo systemctl reload nginx

# 6. Verify Health & Readiness
echo "--> Memeriksa Status Layanan..."
sleep 3
curl -sSf http://127.0.0.1:3000/health > /dev/null && echo "[OK] Backend Liveness: OK"
curl -sSf http://127.0.0.1:3000/ready > /dev/null && echo "[OK] Backend Readiness (DB): OK"
curl -sSf http://127.0.0.1:3100/login > /dev/null && echo "[OK] Frontend Standalone: OK"

echo "=== Deployment Selesai Sukses! ==="
