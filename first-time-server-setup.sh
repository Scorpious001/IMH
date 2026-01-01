#!/bin/bash
# First-Time Server Setup Script for IMH IMS
# Run this ONCE on your EC2 server before the first deployment
# Usage: ./first-time-server-setup.sh [your-github-repo-url]

set -e

REPO_URL="${1:-}"
if [ -z "$REPO_URL" ]; then
    echo "❌ Error: GitHub repository URL required!"
    echo "Usage: ./first-time-server-setup.sh https://github.com/username/repo.git"
    exit 1
fi

echo "🚀 Starting First-Time Server Setup for IMH IMS..."
echo ""

# Step 1: Update system
echo "📦 Step 1: Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Step 2: Install dependencies
echo ""
echo "📦 Step 2: Installing dependencies..."
sudo apt install -y python3.11 python3.11-venv python3-pip nginx postgresql-client git

# Step 3: Clone repository
echo ""
echo "📦 Step 3: Cloning repository..."
if [ -d "/home/ubuntu/SPS-IMH" ]; then
    echo "⚠️  Repository already exists. Skipping clone."
else
    git clone "$REPO_URL" /home/ubuntu/SPS-IMH
fi

# Step 4: Set up virtual environment
echo ""
echo "📦 Step 4: Setting up virtual environment..."
cd /home/ubuntu/SPS-IMH/backend

if [ -d "venv" ]; then
    echo "⚠️  Virtual environment already exists. Skipping creation."
else
    python3.11 -m venv venv
fi

source venv/bin/activate

# Step 5: Install Python dependencies
echo ""
echo "📦 Step 5: Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt
pip install gunicorn psycopg2-binary dj-database-url

# Step 6: Create .env file if it doesn't exist
echo ""
echo "📦 Step 6: Setting up environment variables..."
if [ ! -f .env ]; then
    SECRET_KEY=$(python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())')
    cat > .env << EOF
SECRET_KEY=$SECRET_KEY
DEBUG=False
ALLOWED_HOSTS=3.239.160.128,localhost
DATABASE_URL=sqlite:///db.sqlite3
CORS_ALLOWED_ORIGINS=http://3.239.160.128
USE_TZ=True
TIME_ZONE=UTC
EOF
    echo "✅ Created .env file with generated SECRET_KEY"
    echo "⚠️  Please review and update .env file if needed: nano .env"
else
    echo "⚠️  .env file already exists. Skipping creation."
fi

# Step 7: Run migrations
echo ""
echo "📦 Step 7: Running database migrations..."
python manage.py migrate

# Step 8: Collect static files
echo ""
echo "📦 Step 8: Collecting static files..."
python manage.py collectstatic --noinput

# Step 9: Set up Gunicorn service
echo ""
echo "📦 Step 9: Setting up Gunicorn service..."
sudo tee /etc/systemd/system/imh-ims.service > /dev/null << EOF
[Unit]
Description=IMH IMS Gunicorn daemon
After=network.target

[Service]
User=ubuntu
Group=www-data
WorkingDirectory=/home/ubuntu/SPS-IMH/backend
Environment="PATH=/home/ubuntu/SPS-IMH/backend/venv/bin"
ExecStart=/home/ubuntu/SPS-IMH/backend/venv/bin/gunicorn \\
    --workers 3 \\
    --bind unix:/home/ubuntu/SPS-IMH/backend/imh-ims.sock \\
    --timeout 120 \\
    imh.wsgi:application

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl start imh-ims
sudo systemctl enable imh-ims

# Step 10: Configure Nginx
echo ""
echo "📦 Step 10: Configuring Nginx..."
sudo tee /etc/nginx/sites-available/imh-ims > /dev/null << EOF
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
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
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
EOF

sudo ln -sf /etc/nginx/sites-available/imh-ims /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# Step 11: Fix permissions
echo ""
echo "📦 Step 11: Setting up permissions..."
sudo chown -R ubuntu:www-data /home/ubuntu/SPS-IMH/backend
sudo chmod -R 755 /home/ubuntu/SPS-IMH/backend

# Step 12: Verify services
echo ""
echo "📦 Step 12: Verifying services..."
sleep 3

if sudo systemctl is-active --quiet imh-ims; then
    echo "✅ Gunicorn service is running"
else
    echo "❌ Gunicorn service is not running. Check logs: sudo journalctl -u imh-ims -n 50"
fi

if sudo systemctl is-active --quiet nginx; then
    echo "✅ Nginx service is running"
else
    echo "❌ Nginx service is not running. Check logs: sudo systemctl status nginx"
fi

# Test API
echo ""
echo "📦 Testing API endpoint..."
if curl -s http://localhost/api/auth/csrf/ > /dev/null; then
    echo "✅ API is responding!"
else
    echo "⚠️  API test failed. Check service logs."
fi

echo ""
echo "========================================"
echo "✅ First-Time Setup Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Review .env file: nano /home/ubuntu/SPS-IMH/backend/.env"
echo "2. Create superuser (optional): cd /home/ubuntu/SPS-IMH/backend && source venv/bin/activate && python manage.py createsuperuser"
echo "3. Test from browser: http://3.239.160.128/api/"
echo "4. Now you can use deploy.ps1 or deploy.sh for future deployments!"
echo ""
