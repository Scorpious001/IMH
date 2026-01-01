# Deployment Scripts Setup Guide

This guide explains how to configure and use the deployment scripts (`deploy.ps1` and `deploy.sh`) to deploy IMH IMS to your EC2 server.

## Quick Overview

The deployment scripts follow this workflow:
1. **Commit** any uncommitted changes
2. **Push** to GitHub
3. **SSH to EC2** and pull latest changes
4. **Install dependencies** and run migrations
5. **Restart** the Gunicorn service

---

## Initial Setup (One-Time)

### 1. Configure Deployment Scripts

**For Windows (deploy.ps1):**
```powershell
# Edit deploy.ps1 and update these lines:
$SSH_KEY = "$env:USERPROFILE\.ssh\your-key.pem"  # Your EC2 key file
$SERVER_HOST = "ubuntu@your-ec2-ip-or-domain.com"  # Your EC2 address
$REPO_PATH = "SPS-IMH"  # Repository folder name on server
$BRANCH = "main"  # Your default branch
```

**For Linux/Mac (deploy.sh):**
```bash
# Edit deploy.sh and update these lines:
SSH_KEY="$HOME/.ssh/your-key.pem"  # Your EC2 key file
SERVER_HOST="ubuntu@your-ec2-ip-or-domain.com"  # Your EC2 address
REPO_PATH="SPS-IMH"  # Repository folder name on server
BRANCH="main"  # Your default branch
```

### 2. Set Up EC2 Server (One-Time)

On your EC2 Ubuntu server, you need to:

1. **Clone the repository:**
```bash
cd /home/ubuntu
git clone <your-github-repo-url> SPS-IMH
```

2. **Set up the backend** (if not already done):
```bash
cd SPS-IMH/backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install gunicorn psycopg2-binary
```

3. **Configure Gunicorn service** (if not already done):
   - See `aws-deployment/deploy-ec2.sh` for the full setup
   - The service should be named `imh-ims`

4. **Set up environment variables:**
```bash
cd /home/ubuntu/SPS-IMH/backend
nano .env
# Add your production settings:
# SECRET_KEY=...
# DEBUG=False
# ALLOWED_HOSTS=...
# DATABASE_URL=...
```

---

## Using the Deployment Scripts

### Windows (PowerShell)

```powershell
# Basic usage (auto-commit message)
.\deploy.ps1

# With custom commit message
.\deploy.ps1 "Fixed user authentication bug"
```

### Linux/Mac (Bash)

```bash
# Make script executable (first time only)
chmod +x deploy.sh

# Basic usage (auto-commit message)
./deploy.sh

# With custom commit message
./deploy.sh "Fixed user authentication bug"
```

---

## What the Script Does

1. **Checks for uncommitted changes**
   - If found, stages and commits them
   - Uses auto-generated or custom commit message

2. **Pushes to GitHub**
   - Pushes to the configured branch (usually `main`)

3. **Deploys to EC2:**
   - Pulls latest code from GitHub
   - Activates virtual environment
   - Installs/updates Python dependencies
   - Runs database migrations
   - Collects static files
   - Restarts the Gunicorn service
   - Shows service status

---

## Troubleshooting

### "Permission denied (publickey)"
- Check that your SSH key path is correct
- Ensure the key has correct permissions: `chmod 400 your-key.pem`

### "Repository not found" on server
- Verify `REPO_PATH` matches the folder name on your EC2 server
- Check that the repository is cloned at `/home/ubuntu/SPS-IMH`

### "Service imh-ims not found"
- The Gunicorn service needs to be set up first
- Run `aws-deployment/deploy-ec2.sh` on the server to set it up
- Or manually create the systemd service (see `aws-deployment/deploy-ec2.sh`)

### "Failed to push to repository"
- Check your GitHub credentials
- Ensure you have write access to the repository
- Verify the branch name is correct

### Deployment succeeds but site doesn't update
- Check Gunicorn logs: `sudo journalctl -u imh-ims -n 50`
- Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
- Verify Nginx is running: `sudo systemctl status nginx`
- Try restarting Nginx: `sudo systemctl restart nginx`

---

## Manual Deployment (Alternative)

If you prefer to deploy manually:

```bash
# On your local machine
git add .
git commit -m "Your commit message"
git push origin main

# SSH to server
ssh -i your-key.pem ubuntu@your-ec2-ip

# On server
cd SPS-IMH
git pull origin main
cd backend
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
sudo systemctl restart imh-ims
```

---

## Next Steps

- Set up SSL certificate: `sudo certbot --nginx -d your-domain.com`
- Configure domain DNS to point to your EC2 IP
- Set up monitoring and logging
- Configure automated backups
