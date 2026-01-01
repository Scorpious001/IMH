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
    # Stage modified files
    git add -u 2>&1 | Out-Null
    # Stage new files (excluding SSH INFO) - ignore warnings
    $ErrorActionPreference = "SilentlyContinue"
    Get-ChildItem -Recurse -File | Where-Object { $_.FullName -notlike "*SSH INFO*" -and $_.FullName -notlike "*.git*" } | ForEach-Object {
        $relativePath = $_.FullName.Replace((Get-Location).Path + "\", "").Replace("\", "/")
        git add $relativePath 2>&1 | Out-Null
    }
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

$deployCommand = "cd $REPO_PATH && git pull origin $BRANCH && cd backend && source venv/bin/activate && pip install -r requirements.txt --quiet && python manage.py migrate --noinput && python manage.py collectstatic --noinput && sudo systemctl restart imh-ims && sleep 3 && sudo systemctl status imh-ims --no-pager -l && echo Backend deployment complete"

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

