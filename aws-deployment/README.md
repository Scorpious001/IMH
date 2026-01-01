# AWS Deployment Files

This directory contains scripts and configuration files for deploying the IMH IMS backend to AWS.

## Files

- `deploy-ec2.sh` - EC2 deployment script
- `deploy-eb.sh` - Elastic Beanstalk deployment script
- `requirements-production.txt` - Production Python dependencies
- `.ebextensions/` - Elastic Beanstalk configuration files

## Quick Start

### EC2 Deployment

1. **On your local machine**, copy deployment files:
```bash
scp -i your-key.pem aws-deployment/* ubuntu@your-ec2-ip:/home/ubuntu/
```

2. **On EC2 instance**:
```bash
chmod +x deploy-ec2.sh
./deploy-ec2.sh
```

3. **Follow the prompts** to configure environment variables

### Elastic Beanstalk Deployment

1. **From backend directory**:
```bash
chmod +x aws-deployment/deploy-eb.sh
cd backend
../aws-deployment/deploy-eb.sh
```

2. **Set environment variables** via EB Console or CLI

## Environment Variables

Required environment variables:

- `SECRET_KEY` - Django secret key
- `DEBUG` - Set to `False` for production
- `ALLOWED_HOSTS` - Comma-separated list of allowed domains
- `DATABASE_URL` - PostgreSQL connection string (RDS)
- `CORS_ALLOWED_ORIGINS` - Comma-separated allowed origins

## Database Setup

1. Create RDS PostgreSQL instance in AWS Console
2. Note the endpoint, username, password
3. Update `DATABASE_URL` in environment variables
4. Run migrations: `python manage.py migrate`

## SSL Setup (EC2)

```bash
sudo certbot --nginx -d your-domain.com
```

## Monitoring

- CloudWatch Logs (automatic with EB)
- For EC2: Check logs at `/home/ubuntu/SPS-IMH/backend/logs/`

