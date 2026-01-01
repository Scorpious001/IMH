# Quick Deployment Guide - Android & AWS

## Overview

This guide provides quick steps to:
1. Deploy backend to AWS (EC2 or Elastic Beanstalk)
2. Create Android React Native app
3. Connect Android app to AWS backend

---

## Part 1: AWS Backend Deployment

### Option A: Elastic Beanstalk (Recommended - 15 minutes)

```bash
# 1. Install EB CLI
pip install awsebcli

# 2. Initialize EB from backend directory
cd backend
eb init -p python-3.11 imh-ims-backend --region us-east-1

# 3. Create and deploy
eb create imh-ims-production
eb deploy

# 4. Set environment variables
eb setenv SECRET_KEY=your-secret-key DEBUG=False
# Note: Set DATABASE_URL via AWS Console after creating RDS

# 5. Open your app
eb open
```

### Option B: EC2 (More Control - 30 minutes)

```bash
# 1. Launch EC2 Ubuntu 22.04 instance
# 2. SSH into instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# 3. Run deployment script
chmod +x deploy-ec2.sh
./deploy-ec2.sh

# 4. Configure environment variables in .env
nano .env

# 5. Set up SSL
sudo certbot --nginx -d your-domain.com
```

**Required AWS Setup:**
- RDS PostgreSQL instance
- Security groups (ports 80, 443, 22)
- Domain name (optional but recommended)

---

## Part 2: Android App Setup

### Step 1: Create React Native Project

```bash
# Install React Native CLI
npm install -g react-native-cli

# Create new project
npx react-native@latest init IMHIMSAndroid --template react-native-template-typescript

cd IMHIMSAndroid
```

### Step 2: Install Dependencies

```bash
npm install axios @react-native-async-storage/async-storage
npm install @react-navigation/native @react-navigation/stack
npm install react-native-gesture-handler react-native-reanimated
npm install react-native-screens react-native-safe-area-context
npm install @react-native-community/netinfo
```

### Step 3: Copy Files from Template

Copy these from `android-app-template/`:
- `src/config/api.ts` → `src/config/api.ts`
- `src/services/` → Copy all service files from web app
- `src/types/` → Copy all type files from web app

### Step 4: Configure API URL

Edit `src/config/api.ts`:
```typescript
export const API_BASE_URL = 'https://your-aws-backend-url.com/api';
```

### Step 5: Update Android Manifest

Edit `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.INTERNET" />
<application
    android:usesCleartextTraffic="true"> <!-- Remove in production -->
```

### Step 6: Run App

```bash
# Start Metro bundler
npm start

# Run on Android (in another terminal)
npm run android
```

---

## Part 3: Configuration

### Backend Environment Variables (AWS)

Set these in Elastic Beanstalk Console or EC2 `.env`:

```env
SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=your-domain.com,your-eb-url.elasticbeanstalk.com
DATABASE_URL=postgresql://user:pass@rds-endpoint:5432/imh_db
CORS_ALLOWED_ORIGINS=https://your-domain.com
CORS_ALLOW_ALL_ORIGINS=True  # Allow mobile apps
```

### Android App Configuration

1. **Update API URL**: `src/config/api.ts`
2. **Test connection**: Try login from Android app
3. **Build release APK**: See below

---

## Part 4: Building Android APK

### Development Build

```bash
npm run android
```

### Release Build

```bash
cd android
./gradlew assembleRelease
# APK: android/app/build/outputs/apk/release/app-release.apk
```

### Signed APK (for Play Store)

1. Generate keystore:
```bash
keytool -genkey -v -keystore imh-ims-key.keystore -alias imh-ims -keyalg RSA -keysize 2048 -validity 10000
```

2. Configure `android/app/build.gradle`:
```gradle
android {
    signingConfigs {
        release {
            storeFile file('../imh-ims-key.keystore')
            storePassword 'your-password'
            keyAlias 'imh-ims'
            keyPassword 'your-password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

3. Build signed APK:
```bash
./gradlew assembleRelease
```

---

## Testing Checklist

### Backend Testing

- [ ] API accessible: `curl https://your-backend-url.com/api/items/`
- [ ] Login works: Test with Postman/curl
- [ ] CORS allows Android app
- [ ] Database connected and migrations run
- [ ] SSL certificate working (HTTPS)

### Android App Testing

- [ ] App installs and opens
- [ ] Can connect to backend API
- [ ] Login works
- [ ] Data loads (items, locations, etc.)
- [ ] Offline handling works (optional)
- [ ] Network errors handled gracefully

---

## Troubleshooting

### Backend Issues

**CORS Errors:**
- Add Android app origin to `CORS_ALLOWED_ORIGINS`
- Or set `CORS_ALLOW_ALL_ORIGINS=True` for mobile apps

**Database Connection:**
- Check RDS security group allows EC2 access
- Verify DATABASE_URL format
- Test connection: `psql $DATABASE_URL`

**SSL Certificate:**
- Use Let's Encrypt: `sudo certbot --nginx -d your-domain.com`
- Or use AWS Certificate Manager (ACM) for Elastic Beanstalk

### Android Issues

**Network Error:**
- Check API URL is correct
- Verify backend is accessible
- Check Android internet permission

**Connection Refused:**
- Use `10.0.2.2` for emulator (localhost)
- Use actual IP/domain for physical device
- Ensure backend allows your IP

**Build Errors:**
- Clean build: `cd android && ./gradlew clean`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check Java version: Should be JDK 11+

---

## Next Steps

1. ✅ Backend deployed to AWS
2. ✅ Android app connects to backend
3. ✅ Test all features end-to-end
4. ⬜ Publish to Google Play Store
5. ⬜ Set up monitoring and alerts
6. ⬜ Configure backups

---

## Cost Estimation

**Monthly AWS Costs:**
- EC2 t3.small: ~$15
- RDS db.t3.micro: ~$15
- Data transfer: ~$5-10
- **Total: ~$35-40/month**

**Elastic Beanstalk:**
- Adds load balancer: +$18/month
- **Total: ~$50-65/month**

---

## Support

- See `ANDROID-AWS-DEPLOYMENT.md` for detailed guide
- See `aws-deployment/README.md` for deployment specifics
- Check AWS CloudWatch logs for backend issues
- Use React Native debugger for app issues

