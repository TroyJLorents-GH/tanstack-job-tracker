#!/bin/bash

# Job Tracker Production Deployment Script
# This script deploys the app to Google Cloud Platform

set -e

echo "🚀 Starting Job Tracker Production Deployment..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI not found. Please install it first:"
    echo "   https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Get project ID
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
    echo "❌ No Google Cloud project set. Please run:"
    echo "   gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo "📋 Using project: $PROJECT_ID"

# Enable required APIs
echo "🔧 Enabling required APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Create storage bucket for frontend
BUCKET_NAME="$PROJECT_ID-job-tracker-frontend"
echo "🪣 Creating storage bucket: $BUCKET_NAME"
gsutil mb -p $PROJECT_ID gs://$BUCKET_NAME 2>/dev/null || echo "Bucket already exists"

# Build and deploy using Cloud Build
echo "🏗️  Building and deploying..."
gcloud builds submit --config cloudbuild.yaml .

# Get the backend URL
BACKEND_URL=$(gcloud run services describe job-tracker-backend --region=us-central1 --format="value(status.url)")
FRONTEND_URL="https://storage.googleapis.com/$BUCKET_NAME/index.html"

echo ""
echo "✅ Deployment Complete!"
echo ""
echo "🔗 Backend URL: $BACKEND_URL"
echo "🌐 Frontend URL: $FRONTEND_URL"
echo ""
echo "📝 Next steps:"
echo "1. Update your .env.production with the backend URL:"
echo "   VITE_PARSE_API_URL=$BACKEND_URL"
echo ""
echo "2. Redeploy frontend with updated environment:"
echo "   gcloud builds submit --config cloudbuild.yaml ."
echo ""
echo "3. Set up custom domain (optional):"
echo "   - Buy domain in Google Domains"
echo "   - Configure Cloud DNS"
echo "   - Set up Cloud CDN"
echo ""
echo "🎉 Your job tracker is now live!"
