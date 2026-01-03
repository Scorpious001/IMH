#!/bin/bash
# SSL/HTTPS Setup Script for IMH IMS
# This script sets up Let's Encrypt SSL certificate for the EC2 server

set -e

echo "=== IMH IMS SSL/HTTPS Setup ==="
echo ""
echo "This script will:"
echo "1. Install Certbot (Let's Encrypt client)"
echo "2. Obtain SSL certificate for your domain"
echo "3. Configure Nginx for HTTPS"
echo "4. Set up automatic certificate renewal"
echo ""

# Get server hostname/IP
SERVER_IP="3.234.249.243"
SERVER_DNS="ec2-3-234-249-243.compute-1.amazonaws.com"

echo "Server IP: $SERVER_IP"
echo "Server DNS: $SERVER_DNS"
echo ""

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then 
    echo "Please run with sudo: sudo bash setup-ssl.sh"
    exit 1
fi

# Update system
echo "Updating system packages..."
apt update

# Install Certbot and Nginx plugin
echo "Installing Certbot..."
apt install -y certbot python3-certbot-nginx

# Check if domain is provided
if [ -z "$1" ]; then
    echo ""
    echo "No domain name provided. Using EC2 DNS name: $SERVER_DNS"
    echo "Note: Let's Encrypt requires a valid domain name. If you have a domain,"
    echo "run: sudo bash setup-ssl.sh yourdomain.com"
    echo ""
    read -p "Continue with DNS name? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Exiting. Please provide a domain name or configure DNS first."
        exit 1
    fi
    DOMAIN="$SERVER_DNS"
else
    DOMAIN="$1"
fi

echo ""
echo "Obtaining SSL certificate for: $DOMAIN"
echo "This will automatically configure Nginx for HTTPS..."

# Run Certbot to get certificate and configure Nginx
certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email admin@example.com --redirect

# Note: The email above is a placeholder. Certbot will prompt for a real email.
# For non-interactive mode, you should provide a real email:
# certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email your-email@example.com --redirect

echo ""
echo "=== SSL Setup Complete ==="
echo ""
echo "Your site is now available at: https://$DOMAIN"
echo ""
echo "Certificate will auto-renew. To test renewal:"
echo "  sudo certbot renew --dry-run"
echo ""
echo "To check certificate status:"
echo "  sudo certbot certificates"
echo ""
