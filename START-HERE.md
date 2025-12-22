# IMH IMS - Server Startup Instructions

## Quick Start

If you're getting `ERR_CONNECTION_REFUSED`, the servers aren't running. Follow these steps:

### Option 1: Use the Startup Script (Easiest)

Open PowerShell in the `IMH` folder and run:

```powershell
powershell -ExecutionPolicy Bypass -File .\start-servers.ps1
```

This will open two separate PowerShell windows - one for backend, one for frontend.

**Wait 10-15 seconds** for both servers to start, then try accessing:
- Frontend: http://localhost:3001
- Backend: http://localhost:8000/api/

---

### Option 2: Manual Startup (If Option 1 doesn't work)

#### Step 1: Start Backend Server

Open **PowerShell Terminal 1** and run:

```powershell
cd IMH\backend
.\venv\Scripts\python.exe manage.py runserver 0.0.0.0:8000
```

You should see:
```
Starting development server at http://0.0.0.0:8000/
Quit the server with CTRL-BREAK.
```

**If you see errors**, note them down and check:
- Is the virtual environment activated?
- Are all dependencies installed? (`pip install -r requirements.txt`)
- Are there database migration issues?

#### Step 2: Start Frontend Server

Open **PowerShell Terminal 2** (new window) and run:

```powershell
cd IMH\frontend
npm start
```

You should see:
```
Compiled successfully!

You can now view frontend in the browser.

  Local:            http://localhost:3001
```

**If you see errors**, check:
- Are node_modules installed? (Run `npm install` if needed)
- Is port 3001 available? (Check if another app is using it)

---

### Troubleshooting

#### "Port already in use" Error

If you get a port conflict:

1. Find what's using the port:
   ```powershell
   netstat -ano | findstr ":8000"
   netstat -ano | findstr ":3001"
   ```

2. Kill the process (replace PID with the number from above):
   ```powershell
   taskkill /PID <PID> /F
   ```

#### Backend Won't Start

Common issues:
- **Database locked**: Close any other programs accessing `db.sqlite3`
- **Missing dependencies**: Run `pip install -r requirements.txt` in the backend folder
- **Migration issues**: Run `python manage.py migrate` in the backend folder

#### Frontend Won't Start

Common issues:
- **Missing node_modules**: Run `npm install` in the frontend folder
- **Port conflict**: Change PORT in `frontend/.env` to a different number (e.g., 3002)
- **Node version**: Make sure you have Node.js installed (`node --version`)

---

### Verify Servers Are Running

Once started, verify with:

```powershell
netstat -ano | findstr ":8000 :3001"
```

You should see entries showing the ports are LISTENING.

---

### Access the Application

Once both servers are running:

1. Open your browser
2. Go to: **http://localhost:3001**
3. Login with:
   - Username: `Scorpious`
   - Password: `L8Rb1tch`

---

### Still Having Issues?

1. Check the PowerShell windows for error messages
2. Make sure both servers show "Starting" or "Compiled successfully" messages
3. Wait at least 10-15 seconds after starting before trying to access
4. Try accessing the backend directly: http://localhost:8000/api/ (should show API response)

If the backend works but frontend doesn't, the issue is with React.
If neither works, check firewall/antivirus settings.

