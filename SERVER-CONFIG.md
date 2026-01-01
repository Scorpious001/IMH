# Server Configuration

## EC2 Server Details

- **Server IP:** `3.239.160.128`
- **SSH User:** `ubuntu`
- **SSH Key Location:** `SSH INFO` folder (in project root)
- **Repository Path on Server:** `/home/ubuntu/SPS-IMH`

---

## Quick Connection

### Windows (PowerShell)
```powershell
# Find your SSH key file
Get-ChildItem "SSH INFO" -Filter "*.pem"

# Connect to server
ssh -i "SSH INFO\your-key-file.pem" ubuntu@3.239.160.128
```

### Linux/Mac
```bash
# Find your SSH key file
ls "SSH INFO"/*.pem

# Connect to server
ssh -i "SSH INFO/your-key-file.pem" ubuntu@3.239.160.128
```

---

## Deployment Scripts Configuration

Both `deploy.ps1` and `deploy.sh` are now configured with:
- ✅ Server IP: `3.239.160.128`
- ✅ SSH key: Automatically finds `.pem` file in `SSH INFO` folder
- ✅ Repository path: `SPS-IMH`

**Before first deployment:**
1. Make sure your SSH key file (`.pem`) is in the `SSH INFO` folder
2. Update the scripts if your key file has a specific name

---

## Test Connection

```powershell
# Windows
ssh -i "SSH INFO\*.pem" ubuntu@3.239.160.128 "echo 'Connection successful!'"

# Linux/Mac
ssh -i "SSH INFO"/*.pem ubuntu@3.239.160.128 "echo 'Connection successful!'"
```

---

## Server URLs

- **Application:** http://3.239.160.128
- **API Base:** http://3.239.160.128/api/
- **API Health Check:** http://3.239.160.128/api/auth/csrf/

---

## Deployment

### Using PowerShell (Windows)
```powershell
.\deploy.ps1 "Your commit message"
```

### Using Bash (Linux/Mac)
```bash
./deploy.sh "Your commit message"
```

---

## Next Steps

1. ✅ Server IP configured
2. ⚠️  Verify SSH key file is in `SSH INFO` folder
3. ⚠️  Test SSH connection
4. ⚠️  Set up server (if not already done) - see `AWS-EC2-SETUP-GUIDE.md`
5. ⚠️  Deploy your application
