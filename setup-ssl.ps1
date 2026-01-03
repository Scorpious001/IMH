# SSL/HTTPS Setup Script for IMH IMS (PowerShell)
# This script helps set up SSL/HTTPS on the EC2 server

$SSH_KEY = "F:\SPS-IMH\SSH INFO\IMH.pem"
$SERVER_IP = "3.234.249.243"
$SERVER_USER = "ubuntu"

Write-Host "=== IMH IMS SSL/HTTPS Setup ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "This script will set up Let's Encrypt SSL certificate on your EC2 server"
Write-Host ""

# Check if domain is provided
$domain = $args[0]
if (-not $domain) {
    Write-Host "No domain name provided." -ForegroundColor Yellow
    Write-Host "Let's Encrypt requires a valid domain name." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Cyan
    Write-Host "1. If you have a domain, run: .\setup-ssl.ps1 yourdomain.com"
    Write-Host "2. If you don't have a domain, you can:" -ForegroundColor Yellow
    Write-Host "   - Purchase a domain (e.g., from Route53, Namecheap, etc.)"
    Write-Host "   - Point DNS A record to: $SERVER_IP"
    Write-Host "   - Then run this script with your domain"
    Write-Host ""
    Write-Host "For now, we'll copy the setup script to the server."
    Write-Host "You can SSH in and run it manually when ready."
    Write-Host ""
}

# Copy setup script to server
Write-Host "Copying SSL setup script to server..." -ForegroundColor Green
scp -i $SSH_KEY setup-ssl.sh ${SERVER_USER}@${SERVER_IP}:/home/ubuntu/

Write-Host ""
Write-Host "Script copied successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. SSH into the server:" -ForegroundColor White
Write-Host "   ssh -i `"$SSH_KEY`" $SERVER_USER@$SERVER_IP" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Make the script executable:" -ForegroundColor White
Write-Host "   chmod +x setup-ssl.sh" -ForegroundColor Gray
Write-Host ""
if ($domain) {
    Write-Host "3. Run the script with your domain:" -ForegroundColor White
    Write-Host "   sudo bash setup-ssl.sh $domain" -ForegroundColor Gray
} else {
    Write-Host "3. Run the script (it will prompt for domain):" -ForegroundColor White
    Write-Host "   sudo bash setup-ssl.sh" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   OR if you have a domain:" -ForegroundColor White
    Write-Host "   sudo bash setup-ssl.sh yourdomain.com" -ForegroundColor Gray
}
Write-Host ""
Write-Host "The script will:" -ForegroundColor Cyan
Write-Host "  - Install Certbot (Let's Encrypt client)"
Write-Host "  - Obtain SSL certificate"
Write-Host "  - Configure Nginx for HTTPS"
Write-Host "  - Set up automatic renewal"
Write-Host ""
