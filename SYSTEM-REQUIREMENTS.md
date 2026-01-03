# System Requirements - IMH IMS

## 🎯 For Camera/QR Scanner to Work

### **Critical Requirement: HTTPS/SSL Certificate**

The camera feature **requires HTTPS** because modern browsers block camera access on HTTP connections for security reasons.

**What you need:**
1. **SSL Certificate** (free option: Let's Encrypt)
2. **Domain name** (optional - can use IP, but domain is recommended)
3. **Nginx configured for HTTPS** (port 443)

**Quick Setup:**
```bash
# On your EC2 server
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
# OR if using IP only:
sudo certbot --nginx -d ec2-3-234-249-243.compute-1.amazonaws.com
```

**Current Status:** ❌ Running on HTTP - Camera blocked by browsers
**After SSL:** ✅ Camera will work on all devices

---

## 💻 Software Dependencies

### Backend (Django)
- **Python 3.11+**
- **Django 6.0+**
- **Django REST Framework 3.16+**
- **Gunicorn** (production WSGI server)
- **PostgreSQL** (production) or SQLite (development)
- **Python packages:**
  - `djangorestframework`
  - `django-cors-headers`
  - `qrcode[pil]` (QR code generation)
  - `Pillow` (image processing)
  - `Faker` (test data generation)
  - `pandas` (data processing)
  - `openpyxl` (Excel import/export)

### Frontend (React)
- **Node.js 18+**
- **npm** or **yarn**
- **React 19+**
- **TypeScript 4.9+**
- **Key packages:**
  - `html5-qrcode` (QR scanner for web)
  - `qrcode.react` (QR code display)
  - `axios` (API client)
  - `react-router-dom` (routing)
  - `chart.js` (charts/graphs)

### Mobile (React Native - Optional)
- **Node.js 18+**
- **React Native CLI**
- **Android Studio** (for Android)
- **JDK 11+**
- **Android SDK**
- **react-native-qrcode-scanner** (for mobile QR scanning)

---

## 🖥️ Server Infrastructure

### Current Setup (EC2)
- **OS:** Ubuntu 22.04 LTS
- **Web Server:** Nginx
- **Application Server:** Gunicorn (3 workers)
- **Database:** SQLite (can upgrade to PostgreSQL)
- **Ports Open:** 80 (HTTP), 443 (HTTPS - **needs setup**), 22 (SSH)

### Required Services
1. **Nginx** - Reverse proxy and static file serving
2. **Gunicorn** - Django application server
3. **Systemd** - Service management for Gunicorn
4. **Git** - Code deployment

### Current Nginx Configuration
- Serves React frontend from `/home/ubuntu/SPS-IMH/frontend-build`
- Proxies `/api/` requests to Gunicorn socket
- Serves static files from `/static/` and `/media/`
- **Missing:** HTTPS/SSL configuration

---

## 🔐 Production Requirements

### Security
- ✅ **CORS configured** - Allows frontend to access API
- ✅ **CSRF protection** - Django CSRF tokens
- ✅ **Session authentication** - Cookie-based auth
- ⚠️ **HTTPS/SSL** - **NOT SET UP** (needed for camera)
- ✅ **Security groups** - AWS firewall configured

### Environment Variables
- `SECRET_KEY` - Django secret key
- `DEBUG=False` - Production mode
- `ALLOWED_HOSTS` - Domain/IP whitelist
- `DATABASE_URL` - Database connection (if using PostgreSQL)

### Database
- **Current:** SQLite (`backend/db.sqlite3`)
- **Production Option:** PostgreSQL (RDS recommended)
- **Migrations:** All applied ✅

---

## 📱 Mobile Device Requirements

### For Web Browser Access
- **Modern browser** (Chrome, Safari, Firefox, Edge)
- **HTTPS connection** (for camera access)
- **Camera permission** (user must allow)
- **Internet connection**

### For Native Android App
- **Android 6.0+** (API level 23+)
- **Camera permission** (handled by app)
- **Internet permission** (handled by app)
- **QR scanner library** (`react-native-qrcode-scanner`)

---

## 🚀 What's Currently Working

✅ **Backend API** - Fully functional
✅ **Frontend Web App** - Running and accessible
✅ **Authentication** - Login/logout working
✅ **Database** - SQLite with migrations applied
✅ **QR Code Generation** - Backend can generate QR codes
✅ **QR Code Display** - Frontend can show QR codes
✅ **Manual Code Entry** - Works without camera
✅ **Nginx Configuration** - Serving frontend and proxying API
✅ **Gunicorn Service** - Running as systemd service

---

## ⚠️ What's Missing/Needs Setup

### Critical (For Camera)
1. **HTTPS/SSL Certificate** - Required for camera access
   - **Solution:** Set up Let's Encrypt SSL certificate
   - **Time:** ~10 minutes
   - **Cost:** Free

### Optional (For Production)
2. **PostgreSQL Database** - More robust than SQLite
   - **Solution:** Set up AWS RDS PostgreSQL
   - **Time:** ~30 minutes
   - **Cost:** ~$15-30/month

3. **Domain Name** - Better than IP address
   - **Solution:** Purchase domain and configure DNS
   - **Time:** ~1 hour
   - **Cost:** ~$10-15/year

4. **Backup System** - Database backups
   - **Solution:** Automated RDS backups or manual SQLite backups
   - **Time:** ~1 hour setup
   - **Cost:** Included with RDS

5. **Monitoring** - Server health monitoring
   - **Solution:** AWS CloudWatch or similar
   - **Time:** ~1 hour setup
   - **Cost:** Free tier available

---

## 📋 Quick Checklist

### To Enable Camera:
- [ ] Install Certbot: `sudo apt install certbot python3-certbot-nginx`
- [ ] Get SSL certificate: `sudo certbot --nginx -d your-domain.com`
- [ ] Update Nginx config to redirect HTTP → HTTPS
- [ ] Restart Nginx: `sudo systemctl restart nginx`
- [ ] Test camera access on mobile device

### For Full Production:
- [ ] Set up PostgreSQL (RDS or local)
- [ ] Configure database connection string
- [ ] Set up automated backups
- [ ] Configure domain name and DNS
- [ ] Set up monitoring/alerting
- [ ] Review security settings
- [ ] Set up CI/CD pipeline (optional)

---

## 🛠️ Current System Status

**Server:** AWS EC2 (3.234.249.243)
**OS:** Ubuntu 22.04 LTS
**Web Server:** Nginx (HTTP only)
**App Server:** Gunicorn (running)
**Database:** SQLite
**Frontend:** React (built and deployed)
**Backend:** Django (running)
**SSL/HTTPS:** ❌ Not configured
**Camera Access:** ❌ Blocked (needs HTTPS)

---

## 💡 Next Steps

1. **Immediate:** Set up HTTPS/SSL for camera access
2. **Short-term:** Consider PostgreSQL for production
3. **Long-term:** Domain name, monitoring, backups

Would you like me to help set up HTTPS/SSL now? It's a quick process and will enable camera access immediately.
