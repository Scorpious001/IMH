# IMH IMS Deployment Script
# This script pushes changes to GitHub and deploys to the EC2 server
# Usage: .\deploy.ps1 [commit-message]
#
# Before first use:
# 1. Update SSH_KEY path to your EC2 key file
# 2. Update SERVER_HOST with your EC2 instance address
# 3. Update REPO_PATH if your repository is cloned to a different location on the server

param(
    [string]$CommitMessage = "Auto-deploy: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
)

$ErrorActionPreference = "Stop"

# Configuration
$SERVER_HOST = "ubuntu@3.239.160.128"  # EC2 server IP address
$REPO_PATH = "SPS-IMH"  # Repository path on EC2 server (usually /home/ubuntu/SPS-IMH)
$BRANCH = "main"  # or "master" depending on your default branch

# Resolve SSH key path (get first .pem file in SSH INFO folder)
$SSH_INFO_PATH = Join-Path $PSScriptRoot "SSH INFO"
$SSH_KEY_FILES = Get-ChildItem $SSH_INFO_PATH -Filter "*.pem" -ErrorAction SilentlyContinue
if ($SSH_KEY_FILES -and $SSH_KEY_FILES.Count -gt 0) {
    $SSH_KEY = $SSH_KEY_FILES[0].FullName
    Write-Host "Using SSH key: $SSH_KEY" -ForegroundColor Gray
} else {
    Write-Host "ERROR: No .pem file found in SSH INFO folder!" -ForegroundColor Red
    Write-Host "   Please ensure your SSH key file (.pem) is in: $SSH_INFO_PATH" -ForegroundColor Yellow
    exit 1
}

Write-Host "Starting IMH IMS Deployment..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Check for uncommitted changes
Write-Host "Checking for uncommitted changes..." -ForegroundColor Yellow
$status = git status --porcelain
if ($status) {
    Write-Host "Found uncommitted changes. Staging all changes..." -ForegroundColor Yellow
    # Use git add with explicit exclusions - faster approach
    $ErrorActionPreference = "SilentlyContinue"
    # Add modified and new files, but skip SSH INFO
    git add -A 2>&1 | Where-Object { $_ -notmatch "SSH INFO|Permission denied|fatal" } | Out-Null
    # Force remove SSH INFO from staging if it got added
    git reset -- "SSH INFO/" 2>&1 | Out-Null
    $ErrorActionPreference = "Stop"
    
    Write-Host "Committing changes with message: $CommitMessage" -ForegroundColor Yellow
    git commit -m $CommitMessage
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to commit changes" -ForegroundColor Red
        exit 1
    }
    Write-Host "Changes committed successfully" -ForegroundColor Green
} else {
    Write-Host "No uncommitted changes found" -ForegroundColor Green
}

# Step 2: Push to GitHub
Write-Host ""
Write-Host "Pushing to GitHub repository..." -ForegroundColor Yellow
git push origin $BRANCH

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to push to repository" -ForegroundColor Red
    exit 1
}
Write-Host "Successfully pushed to repository" -ForegroundColor Green

# Step 3: Deploy to server
Write-Host ""
Write-Host "Deploying to EC2 server..." -ForegroundColor Yellow

# Check if repository exists on server, if not, clone it (for public repos)
$checkRepo = ssh -i "$SSH_KEY" "$SERVER_HOST" "test -d ~/$REPO_PATH && echo 'EXISTS' || echo 'NOT_FOUND'" 2>&1

if ($checkRepo -match "NOT_FOUND") {
    Write-Host ""
    Write-Host "Repository not found on server. Attempting to clone..." -ForegroundColor Yellow
    $cloneResult = ssh -i "$SSH_KEY" "$SERVER_HOST" "cd ~ && git clone https://github.com/Scorpious001/IMH.git $REPO_PATH 2>&1"
    
    if ($LASTEXITCODE -ne 0 -or $cloneResult -match "fatal|error") {
        Write-Host ""
        Write-Host "Failed to clone repository automatically." -ForegroundColor Red
        Write-Host "This usually means:" -ForegroundColor Yellow
        Write-Host "  1. Repository is private (needs authentication)" -ForegroundColor White
        Write-Host "  2. Network issues" -ForegroundColor White
        Write-Host ""
        Write-Host "If repository is private, you need to:" -ForegroundColor Cyan
        Write-Host "  - Make it public, OR" -ForegroundColor White
        Write-Host "  - Clone manually with credentials on the server" -ForegroundColor White
        Write-Host ""
        Write-Host "Manual clone command:" -ForegroundColor Cyan
        Write-Host "  ssh -i `"$SSH_KEY`" $SERVER_HOST" -ForegroundColor White
        Write-Host "  cd ~ && git clone https://github.com/Scorpious001/IMH.git $REPO_PATH" -ForegroundColor White
        exit 1
    } else {
        Write-Host "Repository cloned successfully!" -ForegroundColor Green
    }
}

# Build deployment command with first-time setup check
$deployCommand = "cd ~/$REPO_PATH && git pull origin $BRANCH && cd backend && if [ ! -d 'venv' ] || [ ! -f 'venv/bin/activate' ]; then echo 'Setting up virtual environment for first time...' && PYTHON_VERSION=`python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2` && if ! python3 -m venv --help >/dev/null 2>&1; then echo 'Installing python${PYTHON_VERSION}-venv package...' && sudo DEBIAN_FRONTEND=noninteractive apt-get update -qq && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y python${PYTHON_VERSION}-venv || sudo DEBIAN_FRONTEND=noninteractive apt-get install -y python3-venv; fi && rm -rf venv && python3 -m venv venv && source venv/bin/activate && pip install --upgrade pip && pip install -r requirements.txt && pip install gunicorn psycopg2-binary dj-database-url; else source venv/bin/activate; fi && pip install -r requirements.txt --quiet && python manage.py migrate --noinput && python manage.py collectstatic --noinput && if systemctl is-active --quiet imh-ims 2>/dev/null; then sudo systemctl restart imh-ims && sleep 3 && sudo systemctl status imh-ims --no-pager -l; else echo 'Gunicorn service not set up yet. Skipping restart.' && echo 'Run first-time-server-setup.sh to complete server setup.'; fi && echo 'Backend deployment complete'"

ssh -i "$SSH_KEY" "$SERVER_HOST" $deployCommand

if ($LASTEXITCODE -ne 0) {
    Write-Host "Deployment failed on server" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Deployment completed successfully!" -ForegroundColor Green
Write-Host "Application is live at: http://3.239.160.128" -ForegroundColor Cyan
Write-Host "API endpoint: http://3.239.160.128/api/" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  - Check backend logs: ssh -i `"$SSH_KEY`" $SERVER_HOST sudo journalctl -u imh-ims -n 50" -ForegroundColor Gray
Write-Host "  - Check Nginx status: ssh -i `"$SSH_KEY`" $SERVER_HOST sudo systemctl status nginx" -ForegroundColor Gray

