#!/bin/bash

# Cloud Functions Deployment Script for Servio.AI
# Usage: ./deploy-functions.sh [all|notify|rate|cleanup]

set -e

FUNCTION_NAME=$1

echo "🚀 Deploying Servio.AI Cloud Functions..."
echo ""

# Navigate to functions directory
cd "$(dirname "$0")/functions"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
  echo ""
fi

# Deploy based on argument
case $FUNCTION_NAME in
  all)
    echo "🔄 Deploying ALL functions..."
    firebase deploy --only functions
    ;;
  notify)
    echo "🔔 Deploying notifyOnNewMessage..."
    firebase deploy --only functions:notifyOnNewMessage
    ;;
  rate)
    echo "💰 Deploying updateProviderRate..."
    firebase deploy --only functions:updateProviderRate
    ;;
  cleanup)
    echo "🧹 Deploying cleanupOldNotifications..."
    firebase deploy --only functions:cleanupOldNotifications
    ;;
  *)
    echo "❌ Invalid argument!"
    echo ""
    echo "Usage: ./deploy-functions.sh [all|notify|rate|cleanup]"
    echo ""
    echo "Examples:"
    echo "  ./deploy-functions.sh all       # Deploy all functions"
    echo "  ./deploy-functions.sh notify    # Deploy message notifications"
    echo "  ./deploy-functions.sh rate      # Deploy rate calculator"
    echo "  ./deploy-functions.sh cleanup   # Deploy cleanup job"
    exit 1
    ;;
esac

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 View logs:"
echo "  firebase functions:log --only $FUNCTION_NAME"
echo ""
echo "🔍 Monitor:"
echo "  https://console.firebase.google.com/"
