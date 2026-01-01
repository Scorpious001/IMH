# ⚠️ Before Your First Deployment

**IMPORTANT:** The deployment scripts (`deploy.ps1` and `deploy.sh`) assume your server is already set up. You MUST complete the server setup **BEFORE** running the deployment scripts for the first time.

---

## ✅ What You Need Before First Deployment

### 1. Server Must Be Set Up
- ✅ Ubuntu server running on EC2 (IP: 3.239.160.128)
- ✅ Python 3.11, Nginx, and dependencies installed
- ✅ Repository cloned to `/home/ubuntu/SPS-IMH`
- ✅ Virtual environment created and dependencies installed
- ✅ `.env` file configured with environment variables
- ✅ Gunicorn service created and running
- ✅ Nginx configured and running
- ✅ Database migrations run

### 2. Local Setup
- ✅ SSH key file in `SSH INFO` folder
- ✅ GitHub repository access
- ✅ Deployment scripts configured (already done ✅)

---

## 🚀 Quick Start Options

### Option A: Automated Setup (Recommended)

1. **Copy setup script to server:**
```powershell
# From your local machine
scp -i "SSH INFO\*.pem" first-time-server-setup.sh ubuntu@3.239.160.128:~/
```

2. **SSH to server and run:**
```bash
ssh -i "SSH INFO\*.pem" ubuntu@3.239.160.128
chmod +x first-time-server-setup.sh
./first-time-server-setup.sh https://github.com/YOUR_USERNAME/YOUR_REPO.git
```

**Replace `YOUR_USERNAME` and `YOUR_REPO` with your actual GitHub repository!**

### Option B: Manual Setup

Follow the step-by-step guide in `FIRST-DEPLOYMENT-CHECKLIST.md`

---

## ✅ Verification Checklist

Before running your first deployment, verify:

- [ ] Can SSH to server: `ssh -i "SSH INFO\*.pem" ubuntu@3.239.160.128`
- [ ] Repository exists: `ssh ... "ls -la ~/SPS-IMH"`
- [ ] Gunicorn service exists: `ssh ... "sudo systemctl status imh-ims"`
- [ ] Nginx is running: `ssh ... "sudo systemctl status nginx"`
- [ ] API responds: `curl http://3.239.160.128/api/auth/csrf/`

---

## 🎯 After Server Setup

Once the server is set up, you can use the deployment scripts:

```powershell
# Windows
.\deploy.ps1 "First deployment"

# Linux/Mac
./deploy.sh "First deployment"
```

---

## 📚 Documentation

- **Detailed Setup Guide:** `FIRST-DEPLOYMENT-CHECKLIST.md`
- **Automated Setup Script:** `first-time-server-setup.sh`
- **Server Configuration:** `SERVER-CONFIG.md`
- **AWS Setup Guide:** `AWS-EC2-SETUP-GUIDE.md`

---

## ⚠️ Common Mistakes

1. **Running deploy script before server setup**
   - ❌ Will fail: "Repository not found"
   - ✅ Fix: Complete server setup first

2. **Missing .env file**
   - ❌ Will fail: Django configuration errors
   - ✅ Fix: Create .env file on server

3. **Gunicorn service not created**
   - ❌ Will fail: "Service imh-ims not found"
   - ✅ Fix: Create systemd service (see checklist)

4. **Wrong repository URL**
   - ❌ Will fail: "Repository not found"
   - ✅ Fix: Use correct GitHub URL

---

**Ready?** Complete the server setup, then run your first deployment! 🚀
