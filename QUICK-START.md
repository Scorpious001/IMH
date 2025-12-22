# Quick Start Guide

## Step 1: Start Backend Server

Open **PowerShell Window 1** and run:

```powershell
cd "C:\Users\Steve\Desktop\ScorpiousProductionStudios\IMH\IMH\backend"
& ".\venv\Scripts\python.exe" manage.py runserver 0.0.0.0:8000
```

**Look for:** `Starting development server at http://0.0.0.0:8000/`

**Keep this window open!**

---

## Step 2: Start Frontend Server

Open **PowerShell Window 2** and run:

```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
cd "C:\Users\Steve\Desktop\ScorpiousProductionStudios\IMH\IMH\frontend"
npm start
```

**Look for:** `Compiled successfully!` and `Local: http://localhost:3001`

**Keep this window open!**

---

## Step 3: Access the Application

Once both servers show success messages:

1. Open your web browser
2. Go to: **http://localhost:3001**
3. Login with:
   - **Username:** `Scorpious`
   - **Password:** `L8Rb1tch`

---

## Troubleshooting

### Frontend shows "Compiled successfully!" but browser says ERR_CONNECTION_REFUSED
- Wait 10-15 seconds after compilation
- Make sure you're using `http://localhost:3001` (not 3000)
- Check Windows Firewall isn't blocking the port

### Backend won't start
- Make sure you're in the `backend` directory
- Check that `venv\Scripts\python.exe` exists
- Look for error messages in the PowerShell window

### npm start fails
- Make sure you ran `Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process` first
- Check you're in the `frontend` directory
- Try `npm install` if dependencies are missing

---

## What You Should See

**Backend Window:**
```
Starting development server at http://0.0.0.0:8000/
Quit the server with CTRL-BREAK.
```

**Frontend Window:**
```
Compiled successfully!

You can now view frontend in the browser.

  Local:            http://localhost:3001
```

Both windows should stay open and show these messages. If you see errors, share them!

