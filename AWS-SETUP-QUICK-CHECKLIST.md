# AWS EC2 Setup - Quick Checklist

Use this checklist to quickly set up your Ubuntu server on AWS EC2.

---

## ✅ Pre-Setup Checklist

- [ ] AWS Account created
- [ ] Domain name registered (optional)
- [ ] GitHub repository ready
- [ ] EC2 key pair downloaded

---

## ✅ Step-by-Step Checklist

### 1. Create EC2 Instance
- [ ] Launch Ubuntu 22.04 LTS instance
- [ ] Choose instance type (t3.small recommended)
- [ ] Create/download key pair (.pem file)
- [ ] Configure security group (ports 22, 80, 443)
- [ ] Launch instance
- [ ] Note public IP address

### 2. Connect to Server
- [ ] SSH to server: `ssh -i key.pem ubuntu@YOUR_IP`
- [ ] Successfully connected

### 3. Initial Setup
- [ ] Update system: `sudo apt update && sudo apt upgrade -y`
- [ ] Install Python 3.11: `sudo apt install -y python3.11 python3.11-venv`
- [ ] Install Nginx: `sudo apt install -y nginx`
- [ ] Install PostgreSQL client: `sudo apt install -y postgresql-client`

### 4. Application Setup
- [ ] Clone repository: `git clone YOUR_REPO SPS-IMH`
- [ ] Navigate to backend: `cd SPS-IMH/backend`
- [ ] Create virtual environment: `python3.11 -m venv venv`
- [ ] Activate venv: `source venv/bin/activate`
- [ ] Install dependencies: `pip install -r requirements.txt`
- [ ] Install production deps: `pip install gunicorn psycopg2-binary`

### 5. Database Setup
- [ ] **Option A:** Use SQLite (default, no setup needed)
- [ ] **Option B:** Create RDS PostgreSQL instance
- [ ] Note RDS endpoint, username, password
- [ ] Update security group to allow EC2 → RDS connection
- [ ] Create `.env` file with database URL

### 6. Environment Configuration
- [ ] Create `.env` file in `backend/` directory
- [ ] Add `SECRET_KEY` (generate random key)
- [ ] Add `DEBUG=False`
- [ ] Add `ALLOWED_HOSTS` (your domain/IP)
- [ ] Add `DATABASE_URL` (if using RDS)
- [ ] Save file

### 7. Django Setup
- [ ] Run migrations: `python manage.py migrate`
- [ ] Collect static files: `python manage.py collectstatic --noinput`
- [ ] Create superuser: `python manage.py createsuperuser` (optional)

### 8. Gunicorn Service
- [ ] Create service file: `sudo nano /etc/systemd/system/imh-ims.service`
- [ ] Add service configuration
- [ ] Reload systemd: `sudo systemctl daemon-reload`
- [ ] Start service: `sudo systemctl start imh-ims`
- [ ] Enable on boot: `sudo systemctl enable imh-ims`
- [ ] Check status: `sudo systemctl status imh-ims` (should be active)

### 9. Nginx Configuration
- [ ] Create config: `sudo nano /etc/nginx/sites-available/imh-ims`
- [ ] Add Nginx configuration
- [ ] Enable site: `sudo ln -s /etc/nginx/sites-available/imh-ims /etc/nginx/sites-enabled/`
- [ ] Remove default: `sudo rm /etc/nginx/sites-enabled/default`
- [ ] Test config: `sudo nginx -t` (should pass)
- [ ] Restart Nginx: `sudo systemctl restart nginx`
- [ ] Check status: `sudo systemctl status nginx` (should be active)

### 10. SSL Certificate (Optional)
- [ ] Install Certbot: `sudo apt install -y certbot python3-certbot-nginx`
- [ ] Get certificate: `sudo certbot --nginx -d your-domain.com`
- [ ] Test renewal: `sudo certbot renew --dry-run`

### 11. Testing
- [ ] Test API: `curl http://localhost/api/auth/csrf/`
- [ ] Test from browser: `http://YOUR_IP/api/`
- [ ] Check Gunicorn logs: `sudo journalctl -u imh-ims -n 50`
- [ ] Check Nginx logs: `sudo tail /var/log/nginx/error.log`
- [ ] Everything working! ✅

---

## 🔧 Common Commands Reference

```bash
# Restart services
sudo systemctl restart imh-ims nginx

# Check service status
sudo systemctl status imh-ims
sudo systemctl status nginx

# View logs
sudo journalctl -u imh-ims -f
sudo tail -f /var/log/nginx/error.log

# Update and redeploy
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

## 📝 Important Files to Remember

- **EC2 Key:** `~/.ssh/your-key.pem` (local)
- **Environment:** `~/SPS-IMH/backend/.env` (server)
- **Gunicorn Service:** `/etc/systemd/system/imh-ims.service` (server)
- **Nginx Config:** `/etc/nginx/sites-available/imh-ims` (server)

---

## 🚨 Troubleshooting Quick Fixes

| Problem | Solution |
|---------|----------|
| Service won't start | `sudo journalctl -u imh-ims -n 100` |
| 502 Bad Gateway | `sudo systemctl restart imh-ims nginx` |
| Static files missing | `python manage.py collectstatic --noinput` |
| Permission denied | `sudo chown -R ubuntu:www-data ~/SPS-IMH/backend` |

---

**Full detailed guide:** See `AWS-EC2-SETUP-GUIDE.md`
