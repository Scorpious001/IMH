#!/bin/bash
# AWS Elastic Beanstalk Deployment Script
# Run this from the backend directory

set -e

echo "=== IMH IMS Elastic Beanstalk Deployment ==="

# Check if EB CLI is installed
if ! command -v eb &> /dev/null; then
    echo "EB CLI not found. Installing..."
    pip install awsebcli
fi

# Initialize EB (if not already initialized)
if [ ! -f .elasticbeanstalk/config.yml ]; then
    echo "Initializing Elastic Beanstalk..."
    eb init -p python-3.11 imh-ims-backend --region us-east-1
fi

# Create or select environment
echo "Creating/updating environment..."
eb create imh-ims-production || eb use imh-ims-production

# Set environment variables
echo "Setting environment variables..."
eb setenv \
    DJANGO_SETTINGS_MODULE=imh.settings_production \
    SECRET_KEY=$(python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())') \
    DEBUG=False \
    ALLOWED_HOSTS=imh-ims-production.elasticbeanstalk.com

echo "Please manually set these environment variables in EB Console:"
echo "- DATABASE_URL (PostgreSQL RDS connection string)"
echo "- CORS_ALLOWED_ORIGINS"
echo "- TIME_ZONE"

# Deploy
echo "Deploying application..."
eb deploy

echo "=== Deployment Complete ==="
echo "Your app is available at:"
eb status | grep CNAME

echo "To open the app:"
echo "eb open"

