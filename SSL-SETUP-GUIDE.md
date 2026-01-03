# SSL/HTTPS Setup Guide for IMH IMS

This guide will help you set up HTTPS/SSL on your EC2 server to enable camera access for the QR scanner.

## Prerequisites

1. **Domain Name (Recommended)**
   - Let's Encrypt requires a valid domain name
   - You can use the EC2 DNS name, but a custom domain is better
   - If you have a domain, point an A record to: `3.234.249.243`

2. **Server Access**
   - SSH access to your EC2 instance
   - Sudo/root privileges

## Quick Setup (Automated)

### Option 1: Using the Setup Script (Recommended)

**On your local machine:**

1. Copy the SSL setup script to the server:
```powershell
.\setup-ssl.ps1
```

2. SSH into your server:
```bash
ssh -i "F:\SPS-IMH\SSH INFO\IMH.pem" ubuntu@3.234.249.243
```

3. Make the script executable and run it:
```bash
chmod +x setup-ssl.sh
sudo bash setup-ssl.sh yourdomain.com
```

**If you don't have a domain:**
```bash
sudo bash setup-ssl.sh
# The script will prompt you to use the EC2 DNS name
```

### Option 2: Manual Setup

**SSH into your server:**
```bash
ssh -i "F:\SPS-IMH\SSH INFO\IMH.pem" ubuntu@3.234.249.243
```

**Install Certbot:**
```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
```

**Obtain SSL Certificate:**
```bash
# With domain name:
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# With EC2 DNS name (may not work - Let's Encrypt prefers domains):
sudo certbot --nginx -d ec2-3-234-249-243.compute-1.amazonaws.com
```

**Follow the prompts:**
- Enter your email address
- Agree to terms of service
- Choose whether to redirect HTTP to HTTPS (recommended: Yes)

## What Happens

1. **Certbot will:**
   - Obtain SSL certificate from Let's Encrypt
   - Automatically configure Nginx for HTTPS
   - Set up automatic certificate renewal
   - Configure HTTP to HTTPS redirect

2. **Your site will be available at:**
   - `https://yourdomain.com` (or your EC2 DNS name)
   - HTTP traffic will automatically redirect to HTTPS

3. **Certificate Auto-Renewal:**
   - Certbot sets up a cron job to auto-renew certificates
   - Certificates expire every 90 days and auto-renew 30 days before expiry
   - Test renewal: `sudo certbot renew --dry-run`

## Verify SSL Setup

1. **Check certificate status:**
```bash
sudo certbot certificates
```

2. **Test your site:**
   - Visit `https://yourdomain.com` in a browser
   - You should see a padlock icon indicating secure connection

3. **Test camera access:**
   - Open the QR scanner on your mobile device
   - Camera should now work!

## Troubleshooting

### Issue: "Let's Encrypt rate limit exceeded"
**Solution:** Wait a few hours or use a different domain

### Issue: "Domain validation failed"
**Solution:** 
- Ensure DNS A record points to `3.234.249.243`
- Wait for DNS propagation (can take up to 48 hours)
- Check firewall allows port 80 (HTTP) for validation

### Issue: "Nginx configuration error"
**Solution:**
```bash
# Check Nginx configuration
sudo nginx -t

# If errors, check the config file
sudo nano /etc/nginx/sites-available/imh-ims
```

### Issue: "Certificate not renewing"
**Solution:**
```bash
# Check renewal status
sudo certbot renew --dry-run

# Manually renew if needed
sudo certbot renew
```

## After SSL Setup

1. **Update Django Settings** (Already done in this update):
   - HTTPS URLs added to `CORS_ALLOWED_ORIGINS`
   - HTTPS URLs added to `CSRF_TRUSTED_ORIGINS`
   - `SESSION_COOKIE_SECURE` will be set automatically when HTTPS is detected

2. **Restart Services:**
```bash
sudo systemctl restart imh-ims
sudo systemctl restart nginx
```

3. **Test the Application:**
   - Login should work on HTTPS
   - Camera access should work on mobile devices
   - All API calls should work with secure cookies

## Security Notes

- **HSTS Header:** Automatically added by Certbot
- **Secure Cookies:** Set automatically when HTTPS is detected
- **HTTP Redirect:** All HTTP traffic redirects to HTTPS
- **Certificate Renewal:** Automatic via cron job

## Next Steps

After SSL is set up:
1. ✅ Camera access will work on all devices
2. ✅ Secure session cookies
3. ✅ Better security overall
4. ✅ Professional appearance with padlock icon

## Need Help?

If you encounter issues:
1. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
2. Check Certbot logs: `sudo tail -f /var/log/letsencrypt/letsencrypt.log`
3. Verify DNS: `nslookup yourdomain.com`
4. Check firewall: Ensure ports 80 and 443 are open
