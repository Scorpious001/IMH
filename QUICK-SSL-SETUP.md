# Quick SSL Setup - Enable Camera Access

## 🚀 Fast Setup (5 minutes)

### Step 1: SSH into your server
```bash
ssh -i "F:\SPS-IMH\SSH INFO\IMH.pem" ubuntu@3.234.249.243
```

### Step 2: Run the SSL setup script
```bash
chmod +x setup-ssl.sh
sudo bash setup-ssl.sh
```

**If you have a domain name:**
```bash
sudo bash setup-ssl.sh yourdomain.com
```

### Step 3: Follow the prompts
- Enter your email address when prompted
- Agree to terms of service
- Choose to redirect HTTP to HTTPS (recommended: Yes)

### Step 4: Done! 🎉
Your site will now be available at `https://your-domain-or-ip`
Camera access will work on all devices!

---

## 📋 What Was Updated

✅ **Django Settings:**
- Added HTTPS URLs to CORS allowed origins
- Added HTTPS URLs to CSRF trusted origins
- Added HTTPS detection middleware
- Secure cookies will be set automatically when HTTPS is detected

✅ **Nginx Configuration:**
- HTTPS template created (`imh-ims-nginx-https.conf`)
- Certbot will automatically configure Nginx

✅ **SSL Setup Scripts:**
- `setup-ssl.sh` - Automated SSL setup for server
- `setup-ssl.ps1` - Helper script for local machine

---

## 🔍 Verify It Works

1. **Check SSL certificate:**
```bash
sudo certbot certificates
```

2. **Test your site:**
- Visit `https://your-domain-or-ip` in a browser
- You should see a padlock icon 🔒

3. **Test camera:**
- Open QR scanner on mobile device
- Camera should work now!

---

## ⚠️ Important Notes

- **Domain Required:** Let's Encrypt requires a valid domain name
- **DNS Setup:** If using a custom domain, point A record to `3.234.249.243`
- **Port 80:** Must be open for Let's Encrypt validation
- **Auto-Renewal:** Certificates auto-renew every 60 days

---

## 🆘 Troubleshooting

**"Domain validation failed"**
→ Check DNS A record points to server IP
→ Wait for DNS propagation (up to 48 hours)

**"Rate limit exceeded"**
→ Wait a few hours or use different domain

**"Nginx error"**
→ Check config: `sudo nginx -t`
→ View logs: `sudo tail -f /var/log/nginx/error.log`

---

## 📚 Full Documentation

See `SSL-SETUP-GUIDE.md` for detailed instructions and troubleshooting.
