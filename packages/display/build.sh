#!/bin/bash
set -e

# Configuration
IMAGE_NAME="isaackogan/overlay-display"
VERSION="${1:-0.0.5}"
FULL_TAG="${IMAGE_NAME}:v${VERSION}"
LATEST_TAG="${IMAGE_NAME}:latest"

echo "Building overlay display server v${VERSION}"
echo "============================================"

# Step 1: Build the Vite app
echo ""
echo "Step 1: Building Vite application..."
pnpm build

if [ $? -ne 0 ]; then
    echo "Error: Vite build failed"
    exit 1
fi

echo "Vite build completed successfully"

# Step 2: Build and push Docker image
echo ""
echo "Step 2: Building Docker image..."
docker buildx build \
    --platform linux/amd64,linux/arm64 \
    --tag "${FULL_TAG}" \
    --tag "${LATEST_TAG}" \
    --push \
    .

if [ $? -ne 0 ]; then
    echo "Error: Docker build failed"
    exit 1
fi

echo ""
echo "============================================"
echo "Build complete!"
echo "Pushed: ${FULL_TAG}"
echo "Pushed: ${LATEST_TAG}"
