#!/bin/bash
# AWS EC2 Deployment Script for IMH IMS Backend
# Run this on your EC2 instance after initial setup

set -e

echo "=== IMH IMS Backend Deployment ==="

# Configuration
APP_DIR="/home/ubuntu/SPS-IMH/backend"
VENV_DIR="$APP_DIR/venv"
REPO_URL="<your-repo-url>"  # Update with your Git repository URL

# Update system
echo "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install dependencies
echo "Installing system dependencies..."
sudo apt install -y python3.11 python3.11-venv python3-pip nginx postgresql-client

# Clone repository (if not already cloned)
if [ ! -d "$APP_DIR" ]; then
    echo "Cloning repository..."
    git clone "$REPO_URL" /home/ubuntu/SPS-IMH
fi

cd "$APP_DIR"

# Create virtual environment
if [ ! -d "$VENV_DIR" ]; then
    echo "Creating virtual environment..."
    python3.11 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install Python dependencies
echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt
pip install gunicorn psycopg2-binary dj-database-url

# Set up environment variables
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << EOF
SECRET_KEY=$(python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())')
DEBUG=False
ALLOWED_HOSTS=your-domain.com,your-ec2-ip
DATABASE_URL=postgresql://user:password@rds-endpoint:5432/imh_db
CORS_ALLOWED_ORIGINS=https://your-domain.com
USE_TZ=True
TIME_ZONE=UTC
EOF
    echo "Please edit .env file with your actual values!"
    nano .env
fi

# Run migrations
echo "Running database migrations..."
python manage.py migrate

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Create superuser (if needed)
# python manage.py createsuperuser

# Set up Gunicorn service
echo "Setting up Gunicorn service..."
sudo tee /etc/systemd/system/imh-ims.service > /dev/null << EOF
[Unit]
Description=IMH IMS Gunicorn daemon
After=network.target

[Service]
User=ubuntu
Group=www-data
WorkingDirectory=$APP_DIR
Environment="PATH=$VENV_DIR/bin"
ExecStart=$VENV_DIR/bin/gunicorn \\
    --workers 3 \\
    --bind unix:$APP_DIR/imh-ims.sock \\
    imh.wsgi:application

[Install]
WantedBy=multi-user.target
EOF

# Start Gunicorn
echo "Starting Gunicorn service..."
sudo systemctl daemon-reload
sudo systemctl start imh-ims
sudo systemctl enable imh-ims

# Configure Nginx
echo "Configuring Nginx..."
sudo tee /etc/nginx/sites-available/imh-ims > /dev/null << EOF
server {
    listen 80;
    server_name your-domain.com;

    location / {
        include proxy_params;
        proxy_pass http://unix:$APP_DIR/imh-ims.sock;
    }

    location /static/ {
        alias $APP_DIR/staticfiles/;
    }

    location /media/ {
        alias $APP_DIR/media/;
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/imh-ims /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

echo "=== Deployment Complete ==="
echo "Next steps:"
echo "1. Update DNS to point to this server's IP"
echo "2. Install SSL certificate: sudo certbot --nginx -d your-domain.com"
echo "3. Update ALLOWED_HOSTS in .env with your domain"
echo "4. Restart services: sudo systemctl restart imh-ims nginx"

