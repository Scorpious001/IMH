# Complete AWS EC2 Ubuntu Server Setup Guide

This guide walks you through setting up an Ubuntu server on Amazon AWS EC2 for deploying the IMH IMS application.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step 1: Create EC2 Instance](#step-1-create-ec2-instance)
3. [Step 2: Configure Security Groups](#step-2-configure-security-groups)
4. [Step 3: Connect to Your Server](#step-3-connect-to-your-server)
5. [Step 4: Initial Server Setup](#step-4-initial-server-setup)
6. [Step 5: Install Dependencies](#step-5-install-dependencies)
7. [Step 6: Set Up Application](#step-6-set-up-application)
8. [Step 7: Configure Database](#step-7-configure-database)
9. [Step 8: Set Up Gunicorn Service](#step-8-set-up-gunicorn-service)
10. [Step 9: Configure Nginx](#step-9-configure-nginx)
11. [Step 10: Set Up SSL Certificate](#step-10-set-up-ssl-certificate)
12. [Step 11: Test Your Deployment](#step-11-test-your-deployment)
13. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- AWS Account
- Domain name (optional but recommended)
- GitHub repository with your code
- Basic knowledge of Linux commands

---

## Step 1: Create EC2 Instance

### 1.1 Launch Instance

1. **Log in to AWS Console**
   - Go to https://console.aws.amazon.com
   - Navigate to **EC2** service

2. **Click "Launch Instance"**

3. **Configure Instance:**

   **Name:** `IMH-IMS-Server` (or your preferred name)

   **AMI (Amazon Machine Image):**
   - Select **Ubuntu Server 22.04 LTS** (or latest LTS)
   - Architecture: `64-bit (x86)`

   **Instance Type:**
   - For testing: `t3.micro` (Free tier eligible)
   - For production: `t3.small` or `t3.medium`
   - Minimum: `t3.small` recommended

   **Key Pair:**
   - If you don't have one, click "Create new key pair"
   - Name: `imh-ims-key` (or your choice)
   - Key pair type: `RSA`
   - Private key file format: `.pem` (for OpenSSH)
   - **Download the key file** - you'll need it to connect!

   **Network Settings:**
   - Click "Edit"
   - **Security group:** Create new security group
   - **Name:** `imh-ims-sg`
   - **Description:** `Security group for IMH IMS application`
   
   **Inbound Rules (add these):**
   - **SSH (22)** - Source: `My IP` (for security)
   - **HTTP (80)** - Source: `0.0.0.0/0` (anywhere)
   - **HTTPS (443)** - Source: `0.0.0.0/0` (anywhere)
   - **Custom TCP (8000)** - Source: `My IP` (optional, for testing)

   **Storage:**
   - **Size:** 20 GB minimum (30 GB recommended)
   - **Volume type:** `gp3` (General Purpose SSD)

4. **Click "Launch Instance"**

5. **Wait for instance to start** (usually 1-2 minutes)

6. **Note your instance details:**
   - **Public IPv4 address** (e.g., `54.123.45.67`)
   - **Instance ID** (e.g., `i-0123456789abcdef0`)

---

## Step 2: Configure Security Groups

### 2.1 Verify Security Group Rules

1. In EC2 Console, go to **Security Groups**
2. Select your security group (`imh-ims-sg`)
3. Click **Edit inbound rules**
4. Verify these rules exist:

| Type | Protocol | Port Range | Source | Description |
|------|----------|------------|--------|-------------|
| SSH | TCP | 22 | My IP | SSH access |
| HTTP | TCP | 80 | 0.0.0.0/0 | Web traffic |
| HTTPS | TCP | 443 | 0.0.0.0/0 | Secure web traffic |

5. Click **Save rules**

---

## Step 3: Connect to Your Server

### 3.1 Windows (PowerShell)

1. **Move your key file** to `C:\Users\YourUsername\.ssh\`
   - Rename it to something simple like `imh-ims-key.pem`

2. **Set correct permissions** (if needed):
```powershell
icacls C:\Users\YourUsername\.ssh\imh-ims-key.pem /inheritance:r
icacls C:\Users\YourUsername\.ssh\imh-ims-key.pem /grant:r "$env:USERNAME:R"
```

3. **Connect:**
```powershell
ssh -i C:\Users\YourUsername\.ssh\imh-ims-key.pem ubuntu@YOUR_EC2_IP
```

Replace `YOUR_EC2_IP` with your instance's public IP address.

### 3.2 Linux/Mac

1. **Set correct permissions:**
```bash
chmod 400 /path/to/your-key.pem
```

2. **Connect:**
```bash
ssh -i /path/to/your-key.pem ubuntu@YOUR_EC2_IP
```

### 3.3 First Connection

- When prompted "Are you sure you want to continue connecting?", type `yes`
- You should see the Ubuntu welcome message

---

## Step 4: Initial Server Setup

Once connected, run these commands:

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y git curl wget build-essential

# Set timezone (optional)
sudo timedatectl set-timezone UTC

# Check Python version (should be 3.10+)
python3 --version
```

---

## Step 5: Install Dependencies

```bash
# Install Python 3.11 and virtual environment
sudo apt install -y python3.11 python3.11-venv python3-pip

# Install Nginx web server
sudo apt install -y nginx

# Install PostgreSQL client (for RDS connection)
sudo apt install -y postgresql-client

# Verify installations
python3.11 --version
nginx -v
```

---

## Step 6: Set Up Application

### 6.1 Clone Repository

```bash
# Navigate to home directory
cd ~

# Clone your repository
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git SPS-IMH

# Navigate to backend directory
cd SPS-IMH/backend
```

**Note:** Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your actual GitHub repository details.

### 6.2 Create Virtual Environment

```bash
# Create virtual environment
python3.11 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip
```

### 6.3 Install Python Dependencies

```bash
# Install requirements
pip install -r requirements.txt

# Install production dependencies
pip install gunicorn psycopg2-binary dj-database-url
```

---

## Step 7: Configure Database

You have two options:

### Option A: Use SQLite (For Testing/Development)

No additional setup needed. Django will use SQLite by default.

### Option B: Use PostgreSQL on RDS (Recommended for Production)

#### 7.1 Create RDS Database

1. **In AWS Console**, go to **RDS** service
2. Click **Create database**
3. **Configuration:**
   - **Engine:** PostgreSQL
   - **Version:** 15.x or 14.x
   - **Template:** Free tier (for testing) or Production
   - **DB instance identifier:** `imh-ims-db`
   - **Master username:** `imhadmin` (or your choice)
   - **Master password:** Create a strong password (save it!)
   - **DB instance class:** `db.t3.micro` (free tier) or `db.t3.small`
   - **Storage:** 20 GB
   - **VPC:** Same VPC as your EC2 instance
   - **Public access:** No (for security)
   - **VPC security group:** Create new or use existing
   - **Database name:** `imh_db`

4. Click **Create database**
5. **Wait for database to be available** (5-10 minutes)
6. **Note the endpoint:** (e.g., `imh-ims-db.xxxxx.us-east-1.rds.amazonaws.com`)

#### 7.2 Update Security Group

1. In RDS Console, select your database
2. Go to **Connectivity & security** tab
3. Click on **VPC security group**
4. **Edit inbound rules:**
   - **Type:** PostgreSQL
   - **Port:** 5432
   - **Source:** Select your EC2 instance's security group

#### 7.3 Configure Environment Variables

```bash
# Navigate to backend directory
cd ~/SPS-IMH/backend

# Create .env file
nano .env
```

Add these lines (update with your actual values):

```env
SECRET_KEY=your-secret-key-here-generate-a-random-one
DEBUG=False
ALLOWED_HOSTS=your-domain.com,your-ec2-ip,localhost
DATABASE_URL=postgresql://imhadmin:your-password@imh-ims-db.xxxxx.us-east-1.rds.amazonaws.com:5432/imh_db
CORS_ALLOWED_ORIGINS=https://your-domain.com,http://your-ec2-ip
USE_TZ=True
TIME_ZONE=UTC
```

**Generate SECRET_KEY:**
```bash
python3 -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
```

**Save the file:** Press `Ctrl+X`, then `Y`, then `Enter`

---

## Step 8: Set Up Gunicorn Service

### 8.1 Run Initial Setup

```bash
# Make sure you're in the backend directory
cd ~/SPS-IMH/backend
source venv/bin/activate

# Run migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput

# Create superuser (optional, for admin access)
python manage.py createsuperuser
```

### 8.2 Create Gunicorn Service

```bash
# Create systemd service file
sudo nano /etc/systemd/system/imh-ims.service
```

Add this content:

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

### 8.3 Start and Enable Service

```bash
# Reload systemd
sudo systemctl daemon-reload

# Start the service
sudo systemctl start imh-ims

# Enable to start on boot
sudo systemctl enable imh-ims

# Check status
sudo systemctl status imh-ims
```

**You should see:** `active (running)` in green

---

## Step 9: Configure Nginx

### 9.1 Create Nginx Configuration

```bash
# Create site configuration
sudo nano /etc/nginx/sites-available/imh-ims
```

Add this content (update `server_name` with your domain or IP):

```nginx
server {
    listen 80;
    server_name your-domain.com your-ec2-ip;

    # Increase timeouts for large requests
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

### 9.2 Enable Site

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/imh-ims /etc/nginx/sites-enabled/

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t
```

**You should see:** `syntax is ok` and `test is successful`

### 9.3 Start Nginx

```bash
# Restart Nginx
sudo systemctl restart nginx

# Enable on boot
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
```

---

## Step 10: Set Up SSL Certificate (Optional but Recommended)

### 10.1 Install Certbot

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx
```

### 10.2 Get SSL Certificate

```bash
# Replace with your actual domain
sudo certbot --nginx -d your-domain.com

# Follow the prompts:
# - Enter your email address
# - Agree to terms of service
# - Choose whether to redirect HTTP to HTTPS (recommended: Yes)
```

### 10.3 Auto-Renewal

Certbot automatically sets up renewal. Test it:

```bash
sudo certbot renew --dry-run
```

---

## Step 11: Test Your Deployment

### 11.1 Test from Server

```bash
# Test Gunicorn
curl http://localhost/api/auth/csrf/

# Test Nginx
curl http://localhost/api/auth/csrf/
```

### 11.2 Test from Browser

1. Open your browser
2. Go to: `http://YOUR_EC2_IP/api/` or `https://your-domain.com/api/`
3. You should see API responses

### 11.3 Check Logs

```bash
# Gunicorn logs
sudo journalctl -u imh-ims -n 50 --no-pager

# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Nginx access logs
sudo tail -f /var/log/nginx/access.log
```

---

## Troubleshooting

### Service Won't Start

```bash
# Check service status
sudo systemctl status imh-ims

# Check logs
sudo journalctl -u imh-ims -n 100

# Common issues:
# - Check .env file exists and has correct values
# - Verify virtual environment path is correct
# - Check file permissions
```

### 502 Bad Gateway

```bash
# Check if Gunicorn is running
sudo systemctl status imh-ims

# Check socket file permissions
ls -la /home/ubuntu/SPS-IMH/backend/imh-ims.sock

# Restart services
sudo systemctl restart imh-ims nginx
```

### Database Connection Error

```bash
# Test database connection
psql -h your-rds-endpoint -U imhadmin -d imh_db

# Check security group allows connection
# Verify DATABASE_URL in .env file
```

### Static Files Not Loading

```bash
# Recollect static files
cd ~/SPS-IMH/backend
source venv/bin/activate
python manage.py collectstatic --noinput

# Check permissions
sudo chown -R ubuntu:www-data /home/ubuntu/SPS-IMH/backend/staticfiles
```

### Permission Denied Errors

```bash
# Fix ownership
sudo chown -R ubuntu:www-data /home/ubuntu/SPS-IMH/backend

# Fix socket permissions
sudo chmod 666 /home/ubuntu/SPS-IMH/backend/imh-ims.sock
```

---

## Quick Reference Commands

```bash
# Restart services
sudo systemctl restart imh-ims nginx

# Check service status
sudo systemctl status imh-ims
sudo systemctl status nginx

# View logs
sudo journalctl -u imh-ims -f
sudo tail -f /var/log/nginx/error.log

# Update code
cd ~/SPS-IMH
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

1. ✅ Server is set up and running
2. ✅ Configure your domain DNS to point to EC2 IP
3. ✅ Set up automated backups
4. ✅ Configure monitoring (CloudWatch)
5. ✅ Set up CI/CD pipeline (use `deploy.ps1` or `deploy.sh`)

Your IMH IMS application should now be live and accessible!
