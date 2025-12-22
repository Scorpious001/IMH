# Manual Server Startup Instructions

## The Problem
PowerShell requires explicit path syntax. Use the commands below.

## Step 1: Start Backend Server

Open **PowerShell** and run these commands **one at a time**:

```powershell
cd "C:\Users\Steve\Desktop\ScorpiousProductionStudios\IMH\IMH\backend"
& ".\venv\Scripts\python.exe" manage.py runserver 0.0.0.0:8000
```

**OR** use the full path:

```powershell
& "C:\Users\Steve\Desktop\ScorpiousProductionStudios\IMH\IMH\backend\venv\Scripts\python.exe" "C:\Users\Steve\Desktop\ScorpiousProductionStudios\IMH\IMH\backend\manage.py" runserver 0.0.0.0:8000
```

You should see:
```
Starting development server at http://0.0.0.0:8000/
Quit the server with CTRL-BREAK.
```

**Keep this window open!**

---

## Step 2: Start Frontend Server

Open a **NEW PowerShell window** and run:

```powershell
cd "C:\Users\Steve\Desktop\ScorpiousProductionStudios\IMH\IMH\frontend"
npm start
```

You should see:
```
Compiled successfully!

You can now view frontend in the browser.

  Local:            http://localhost:3001
```

**Keep this window open too!**

---

## Step 3: Access the Application

Once both show success messages, open your browser and go to:

**http://localhost:3001**

Login with:
- Username: `Scorpious`
- Password: `L8Rb1tch`

---

## Troubleshooting

### If Python command fails:
```powershell
# Check if Python exists
Test-Path ".\venv\Scripts\python.exe"

# If False, the venv might not be set up correctly
```

### If npm start fails:
```powershell
# Make sure you're in the frontend directory
Get-Location

# Should show: C:\Users\Steve\Desktop\ScorpiousProductionStudios\IMH\IMH\frontend
```

### Port already in use:
```powershell
# Find what's using the port
netstat -ano | findstr ":8000"
netstat -ano | findstr ":3001"

# Kill the process (replace PID with the number)
taskkill /PID <PID> /F
```

