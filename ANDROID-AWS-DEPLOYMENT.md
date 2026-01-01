# IMH IMS - Android App & AWS Deployment Guide

This guide covers deploying the IMH Inventory Management System with:
- **Android Native App** (React Native)
- **AWS Backend** (EC2 or Elastic Beanstalk)

---

## Table of Contents

1. [AWS Backend Deployment](#aws-backend-deployment)
2. [Android App Setup](#android-app-setup)
3. [Configuration](#configuration)
4. [Testing & Deployment](#testing--deployment)

---

## AWS Backend Deployment

### Option 1: AWS Elastic Beanstalk (Recommended - Easiest)

#### Prerequisites
- AWS Account
- AWS CLI installed and configured
- EB CLI installed: `pip install awsebcli`

#### Steps

1. **Install AWS CLI and EB CLI**:
```bash
pip install awsebcli
aws configure  # Enter your AWS credentials
```

2. **Initialize Elastic Beanstalk**:
```bash
cd backend
eb init -p python-3.11 imh-ims-backend --region us-east-1
```

3. **Create production settings**:
- Copy `imh/settings.py` to `imh/settings_production.py`
- Update with AWS RDS database and environment variables

4. **Deploy**:
```bash
eb create imh-ims-production
eb deploy
```

5. **Set environment variables** (via AWS Console or CLI):
```bash
eb setenv SECRET_KEY=your-secret-key-here \
          DEBUG=False \
          ALLOWED_HOSTS=your-eb-url.elasticbeanstalk.com \
          DATABASE_URL=postgresql://user:pass@rds-endpoint:5432/imh_db
```

#### Advantages
- Automatic scaling
- Load balancing
- Health monitoring
- Easy rollback
- Database management (RDS integration)

---

### Option 2: AWS EC2 (More Control)

#### Prerequisites
- AWS Account
- EC2 key pair
- Security group configured (ports 80, 443, 22, 8000)

#### Steps

1. **Launch EC2 Instance**:
   - AMI: Ubuntu 22.04 LTS
   - Instance Type: t3.small or t3.medium
   - Security Group: Open ports 80, 443, 22
   - Storage: 20GB minimum

2. **Connect to EC2**:
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

3. **Install Dependencies**:
```bash
sudo apt update
sudo apt install -y python3.11 python3.11-venv python3-pip nginx postgresql-client
```

4. **Set Up Application**:
```bash
# Clone your repository
git clone <your-repo-url>
cd SPS-IMH/backend

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
pip install gunicorn psycopg2-binary

# Set up environment variables
nano .env
# Add:
# SECRET_KEY=your-secret-key
# DEBUG=False
# ALLOWED_HOSTS=your-domain.com,your-ec2-ip
# DATABASE_URL=postgresql://user:pass@rds-endpoint:5432/imh_db
```

5. **Set Up PostgreSQL Database (RDS)**:
   - Create RDS PostgreSQL instance in AWS Console
   - Note the endpoint, username, password
   - Update DATABASE_URL in .env

6. **Run Migrations**:
```bash
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser
```

7. **Set Up Gunicorn**:
```bash
# Create gunicorn service
sudo nano /etc/systemd/system/imh-ims.service
```

Add:
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
    imh.wsgi:application

[Install]
WantedBy=multi-user.target
```

8. **Start Gunicorn**:
```bash
sudo systemctl start imh-ims
sudo systemctl enable imh-ims
```

9. **Configure Nginx**:
```bash
sudo nano /etc/nginx/sites-available/imh-ims
```

Add:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        include proxy_params;
        proxy_pass http://unix:/home/ubuntu/SPS-IMH/backend/imh-ims.sock;
    }

    location /static/ {
        alias /home/ubuntu/SPS-IMH/backend/staticfiles/;
    }

    location /media/ {
        alias /home/ubuntu/SPS-IMH/backend/media/;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/imh-ims /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

10. **Set Up SSL (Let's Encrypt)**:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

#### Advantages
- Full control over server
- Cost-effective for small deployments
- Custom configurations possible

---

## Android App Setup

### Prerequisites
- Node.js 18+
- React Native CLI: `npm install -g react-native-cli`
- Android Studio with Android SDK
- JDK 11+
- Android device or emulator

### Initial Setup

1. **Create React Native Project**:
```bash
cd ..
npx react-native@latest init IMHIMSAndroid --template react-native-template-typescript
cd IMHIMSAndroid
```

2. **Install Dependencies**:
```bash
npm install axios react-navigation @react-navigation/native @react-navigation/stack
npm install @react-native-async-storage/async-storage
npm install react-native-gesture-handler react-native-reanimated
npm install react-native-screens react-native-safe-area-context
npm install @react-native-community/netinfo
```

3. **Copy Source Files**:
   - Copy `src/services` from React web app
   - Copy `src/types` from React web app
   - Copy `src/components` (adapt for React Native)
   - Copy `src/pages` (adapt for React Native)

4. **Update API Configuration**:
   - Create `src/config/api.ts` with AWS backend URL
   - Update axios baseURL to point to AWS

5. **Android-Specific Configuration**:
```bash
# Update android/app/src/main/AndroidManifest.xml
# Add internet permission and allow clear text (for HTTP during dev)
```

6. **Run on Android**:
```bash
# Start Metro bundler
npm start

# In another terminal
npm run android
```

### Project Structure
```
IMHIMSAndroid/
├── android/          # Android native code
├── ios/             # iOS native code (for future)
├── src/
│   ├── components/  # React Native components
│   ├── services/    # API services (shared with web)
│   ├── types/       # TypeScript types
│   ├── screens/     # Screen components
│   ├── navigation/  # Navigation setup
│   ├── config/      # Configuration (API URLs, etc.)
│   └── utils/       # Utility functions
├── App.tsx          # Main app component
└── package.json
```

---

## Configuration

### Backend Environment Variables

Create `.env` file on AWS server:

```env
SECRET_KEY=your-production-secret-key-here
DEBUG=False
ALLOWED_HOSTS=your-domain.com,your-ec2-ip,your-eb-url.elasticbeanstalk.com
DATABASE_URL=postgresql://user:password@rds-endpoint.region.rds.amazonaws.com:5432/imh_db
CORS_ALLOWED_ORIGINS=https://your-domain.com
USE_TZ=True
TIME_ZONE=UTC
```

### Android API Configuration

Create `src/config/api.ts`:

```typescript
// Production API URL
export const API_BASE_URL = 'https://your-aws-backend-url.com/api';

// Development API URL (for testing)
// export const API_BASE_URL = 'http://10.0.2.2:8000/api';  // Android emulator localhost
```

### Django Settings Updates

Key changes needed in `settings_production.py`:

1. **Database**: Use PostgreSQL (RDS) instead of SQLite
2. **Static Files**: Use S3 or collectstatic
3. **CORS**: Allow Android app origins
4. **Security**: HTTPS, secure cookies, CSRF settings
5. **Logging**: Configure CloudWatch or file logging

---

## Testing & Deployment

### Backend Testing

1. **Test API Endpoints**:
```bash
curl https://your-backend-url.com/api/items/
```

2. **Check Health**:
```bash
curl https://your-backend-url.com/api/health/
```

### Android App Testing

1. **Development Testing**:
   - Use Android emulator with local backend
   - Or point to staging AWS backend

2. **Production Build**:
```bash
cd android
./gradlew assembleRelease
# APK will be in android/app/build/outputs/apk/release/
```

3. **Sign APK** (for Play Store):
```bash
keytool -genkey -v -keystore imh-ims-key.keystore -alias imh-ims -keyalg RSA -keysize 2048 -validity 10000
```

4. **Generate Signed APK**:
   - Open Android Studio
   - Build > Generate Signed Bundle/APK
   - Select APK, choose keystore, build

### Deployment Checklist

- [ ] Backend deployed to AWS
- [ ] Database (RDS) configured and migrations run
- [ ] SSL certificate installed (HTTPS)
- [ ] Environment variables set
- [ ] CORS configured for Android app
- [ ] Static files served (S3 or Nginx)
- [ ] Logging configured
- [ ] Monitoring set up (CloudWatch)
- [ ] Android app API URL updated
- [ ] Android app tested with production backend
- [ ] APK signed and ready for distribution

---

## Security Considerations

1. **Backend**:
   - Use HTTPS only
   - Secure SECRET_KEY (never commit)
   - Enable Django security middleware
   - Regular security updates
   - Database backups

2. **Android App**:
   - Use HTTPS for all API calls
   - Store credentials securely (Keychain/Keystore)
   - Certificate pinning (optional)
   - Code obfuscation (ProGuard)

3. **AWS**:
   - Security groups (minimal open ports)
   - IAM roles (least privilege)
   - VPC for isolation
   - Regular backups

---

## Cost Estimation

### AWS Costs (Approximate Monthly)

**EC2 Option**:
- EC2 t3.small: ~$15/month
- RDS db.t3.micro: ~$15/month
- Data transfer: ~$5-10/month
- **Total: ~$35-40/month**

**Elastic Beanstalk Option**:
- EC2 (auto-scaled): ~$15-30/month
- RDS db.t3.micro: ~$15/month
- Load balancer: ~$18/month
- **Total: ~$50-65/month**

---

## Support & Troubleshooting

### Common Issues

1. **CORS Errors**: Update ALLOWED_ORIGINS in Django settings
2. **Database Connection**: Check RDS security group, endpoint, credentials
3. **Static Files 404**: Run collectstatic, check Nginx configuration
4. **Android Network Error**: Check API URL, internet permission, HTTPS

### Useful Commands

```bash
# View backend logs (EC2)
sudo journalctl -u imh-ims -f

# View Nginx logs
sudo tail -f /var/log/nginx/error.log

# Django shell (EC2)
source venv/bin/activate
python manage.py shell

# Test Android API connection
adb logcat | grep -i "network\|api"
```

---

## Next Steps

1. Set up AWS infrastructure (EC2 or EB)
2. Deploy backend with production settings
3. Set up RDS PostgreSQL database
4. Create React Native Android app
5. Test end-to-end connectivity
6. Deploy to production
7. Publish Android app to Google Play Store

---

For detailed setup instructions, see:
- `AWS-DEPLOYMENT-STEPS.md` - Step-by-step AWS deployment
- `ANDROID-APP-SETUP.md` - Detailed Android app setup

