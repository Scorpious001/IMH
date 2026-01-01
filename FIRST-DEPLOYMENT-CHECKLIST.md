# First Deployment Checklist

**IMPORTANT:** Before running `deploy.ps1` or `deploy.sh` for the first time, you MUST set up the server first!

---

## ✅ Pre-Deployment Server Setup (Required)

The deployment scripts assume the server is already set up. You need to do this **ONE TIME** before the first deployment.

### Step 1: Connect to Server

```powershell
# Windows - Find your SSH key first
Get-ChildItem "SSH INFO" -Filter "*.pem"

# Connect (replace with your actual key filename)
ssh -i "SSH INFO\your-key.pem" ubuntu@3.239.160.128
```

### Step 2: Initial Server Setup

Run these commands on the server:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y python3.11 python3.11-venv python3-pip nginx postgresql-client git

# Verify installations
python3.11 --version
nginx -v
```

### Step 3: Clone Repository

```bash
# Navigate to home directory
cd ~

# Clone your repository (replace with your actual GitHub URL)
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git SPS-IMH

# Navigate to backend
cd SPS-IMH/backend
```

**⚠️ IMPORTANT:** Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your actual GitHub repository details!

### Step 4: Set Up Virtual Environment

```bash
# Create virtual environment
python3.11 -m venv venv

# Activate it
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt
pip install gunicorn psycopg2-binary dj-database-url
```

### Step 5: Configure Environment Variables

```bash
# Create .env file
nano .env
```

Add these lines (update with your values):

```env
SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=3.239.160.128,localhost
DATABASE_URL=sqlite:///db.sqlite3
CORS_ALLOWED_ORIGINS=http://3.239.160.128
USE_TZ=True
TIME_ZONE=UTC
```

**Generate SECRET_KEY:**
```bash
python3 -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
```

**Save:** Press `Ctrl+X`, then `Y`, then `Enter`

### Step 6: Run Initial Django Setup

```bash
# Make sure you're in backend directory with venv activated
cd ~/SPS-IMH/backend
source venv/bin/activate

# Run migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput

# Create superuser (optional)
python manage.py createsuperuser
```

### Step 7: Set Up Gunicorn Service

```bash
# Create systemd service file
sudo nano /etc/systemd/system/imh-ims.service
```

Paste this content:

```ini
[Unit]
Description=IMH IMS Gunicorn daemon
After=network.target

[Service]
User=ubuntu
Group=www-data
WorkingDirectory=/home/ubuntu/SPS-IMH/backend
Environment="PATH=/home/ubuntu/SPS-IMH/backend/venv/bin"
ExecStart=/home/ubuntu/SPS-IMH/backend/venv/bin/gunicorn \
    --workers 3 \
    --bind unix:/home/ubuntu/SPS-IMH/backend/imh-ims.sock \
    --timeout 120 \
    imh.wsgi:application

[Install]
WantedBy=multi-user.target
```

**Save:** `Ctrl+X`, `Y`, `Enter`

```bash
# Reload systemd
sudo systemctl daemon-reload

# Start service
sudo systemctl start imh-ims

# Enable on boot
sudo systemctl enable imh-ims

# Check status
sudo systemctl status imh-ims
```

**Should see:** `active (running)` in green

### Step 8: Configure Nginx

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/imh-ims
```

Paste this content:

```nginx
server {
    listen 80;
    server_name 3.239.160.128;

    client_max_body_size 100M;
    proxy_read_timeout 300;
    proxy_connect_timeout 300;
    proxy_send_timeout 300;

    location / {
        include proxy_params;
        proxy_pass http://unix:/home/ubuntu/SPS-IMH/backend/imh-ims.sock;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static/ {
        alias /home/ubuntu/SPS-IMH/backend/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location /media/ {
        alias /home/ubuntu/SPS-IMH/backend/media/;
        expires 7d;
        add_header Cache-Control "public";
    }
}
```

**Save:** `Ctrl+X`, `Y`, `Enter`

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/imh-ims /etc/nginx/sites-enabled/

# Remove default
sudo rm -f /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Check status
sudo systemctl status nginx
```

---

## ✅ Verify Setup

Test that everything is working:

```bash
# Test Gunicorn
curl http://localhost/api/auth/csrf/

# Test from outside (from your local machine)
curl http://3.239.160.128/api/auth/csrf/
```

If you get JSON responses, you're ready!

---

## ✅ Now You Can Deploy!

Once the server is set up, you can use the deployment scripts:

**Windows:**
```powershell
.\deploy.ps1 "First deployment"
```

**Linux/Mac:**
```bash
./deploy.sh "First deployment"
```

---

## ⚠️ Common First-Time Issues

### "Repository not found"
- Make sure you've cloned the repository on the server
- Check the path: `ls -la ~/SPS-IMH`

### "Service imh-ims not found"
- You need to create the Gunicorn service first (Step 7)
- Check: `sudo systemctl status imh-ims`

### "Permission denied"
- Fix permissions: `sudo chown -R ubuntu:www-data ~/SPS-IMH/backend`
- Fix socket: `sudo chmod 666 ~/SPS-IMH/backend/imh-ims.sock`

### "502 Bad Gateway"
- Check Gunicorn is running: `sudo systemctl status imh-ims`
- Check Nginx: `sudo systemctl status nginx`
- Check logs: `sudo journalctl -u imh-ims -n 50`

---

## 📝 Quick Setup Script

I've also created a setup script you can run on the server. See `first-time-server-setup.sh` for an automated version of the above steps.
