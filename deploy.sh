#!/bin/bash
# IMH IMS Deployment Script (Linux/Mac)
# This script pushes changes to GitHub and deploys to the EC2 server
# Usage: ./deploy.sh [commit-message]
#
# Before first use:
# 1. Update SSH_KEY path to your EC2 key file
# 2. Update SERVER_HOST with your EC2 instance address
# 3. Update REPO_PATH if your repository is cloned to a different location on the server

set -e

COMMIT_MESSAGE="${1:-Auto-deploy: $(date '+%Y-%m-%d %H:%M:%S')}"

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_HOST="ubuntu@3.239.160.128"  # EC2 server IP address
REPO_PATH="SPS-IMH"  # Repository path on EC2 server (usually /home/ubuntu/SPS-IMH)
BRANCH="main"  # or "master" depending on your default branch

# Resolve SSH key path (get first .pem file in SSH INFO folder)
SSH_INFO_PATH="$SCRIPT_DIR/SSH INFO"
SSH_KEY_FILES=("$SSH_INFO_PATH"/*.pem)
if [ -f "${SSH_KEY_FILES[0]}" ]; then
    SSH_KEY="${SSH_KEY_FILES[0]}"
    echo "Using SSH key: $SSH_KEY"
else
    echo "❌ Error: No .pem file found in SSH INFO folder!"
    echo "   Please ensure your SSH key file (.pem) is in: $SSH_INFO_PATH"
    exit 1
fi

echo "🚀 Starting IMH IMS Deployment..."
echo ""

# Step 1: Check for uncommitted changes
echo "📋 Checking for uncommitted changes..."
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Found uncommitted changes. Staging all changes..."
    git add .
    
    echo "💾 Committing changes with message: $COMMIT_MESSAGE"
    git commit -m "$COMMIT_MESSAGE"
    
    echo "✅ Changes committed successfully"
else
    echo "✅ No uncommitted changes found"
fi

# Step 2: Push to GitHub
echo ""
echo "📤 Pushing to GitHub repository..."
git push origin $BRANCH

if [ $? -ne 0 ]; then
    echo "❌ Failed to push to repository"
    exit 1
fi
echo "✅ Successfully pushed to repository"

# Step 3: Deploy to server
echo ""
echo "🌐 Deploying to EC2 server..."

ssh -i "$SSH_KEY" "$SERVER_HOST" << EOF
cd $REPO_PATH && \
git pull origin $BRANCH && \
cd backend && \
source venv/bin/activate && \
pip install -r requirements.txt --quiet && \
python manage.py migrate --noinput && \
python manage.py collectstatic --noinput && \
sudo systemctl restart imh-ims && \
sleep 3 && \
sudo systemctl status imh-ims --no-pager -l && \
echo '' && \
echo '✅ Backend deployment complete!'
EOF

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed on server"
    exit 1
fi

echo ""
echo "✅ Deployment completed successfully!"
echo "🌍 Application is live at: http://3.239.160.128"
echo "🌍 API endpoint: http://3.239.160.128/api/"
echo ""
echo "Next steps:"
echo "  - Check backend logs: ssh -i \"$SSH_KEY\" $SERVER_HOST 'sudo journalctl -u imh-ims -n 50'"
echo "  - Check Nginx status: ssh -i \"$SSH_KEY\" $SERVER_HOST 'sudo systemctl status nginx'"

