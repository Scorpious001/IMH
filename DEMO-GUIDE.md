# IMH IMS Demo Guide

This guide will help you set up and run a demo of the IMH Inventory Management System.

## Quick Demo Setup

### Option 1: One-Click Demo (Recommended)

Run this PowerShell script from the project root:

```powershell
.\setup-demo.ps1
```

This will:
- Start both backend and frontend servers
- Generate demo data (smaller dataset optimized for demos)
- Open the application in your browser
- Display login credentials

---

## Option 2: Manual Demo Setup

### Step 1: Start the Servers

**Option A:** Use the startup script:
```powershell
.\start-servers.ps1
```

**Option B:** Start manually:
1. **Backend** (PowerShell Window 1):
```powershell
cd backend
.\venv\Scripts\python.exe manage.py runserver 0.0.0.0:8000
```

2. **Frontend** (PowerShell Window 2):
```powershell
cd frontend
npm start
```

Wait 10-15 seconds for both servers to start.

### Step 2: Generate Demo Data

In a **new PowerShell window** (while servers are running):

```powershell
cd backend
.\venv\Scripts\python.exe manage.py generate_test_data --clear --categories 15 --vendors 10 --locations 20 --items 200 --requisitions 50 --count-sessions 20 --purchase-requests 30 --transactions 100
```

This creates a **realistic but manageable demo dataset**:
- 15 categories
- 10 vendors
- 20 locations (storerooms, rooms, closets, carts)
- 200 inventory items
- 50 requisitions
- 20 cycle count sessions
- 30 purchase requests
- 100 transactions

### Step 3: Access the Application

1. Open your browser
2. Navigate to: **http://localhost:3001**
3. Login with:
   - **Username:** `Scorpious`
   - **Password:** `L8Rb1tch`

---

## Demo Walkthrough Guide

### 1. **Catalog** (Browse Inventory)
- **What to show:** Visual tile-based catalog with 200 items
- **Highlights:**
  - Search functionality
  - Category filters
  - Item details with photos, costs, lead times
  - Stock status indicators (Green/Amber/Red)
  - Par level monitoring

### 2. **Stock by Location** (Multi-Location Inventory)
- **What to show:** Hierarchical view of inventory across 20 locations
- **Highlights:**
  - Property → Building → Floor → Room organization
  - Real-time stock quantities
  - Available vs reserved quantities
  - Stock transfers between locations

### 3. **Requisitions** (Internal Stock Requests)
- **What to show:** Requisition workflow with 50 existing requisitions
- **Highlights:**
  - Create new requisition
  - Approve requisitions
  - Pick mode for stock transfers
  - Status workflow: PENDING → APPROVED → PICKED → COMPLETED

### 4. **Receiving** (Vendor Receiving)
- **What to show:** Receiving items from vendors
- **Highlights:**
  - Receive purchase orders
  - Update stock levels automatically
  - Receiving history

### 5. **Counts** (Cycle Counting)
- **What to show:** Physical inventory counting with 20 count sessions
- **Highlights:**
  - Create count session
  - Record counted quantities
  - Variance calculations
  - Approve count sessions to update stock

### 6. **Reports & Alerts** (Analytics)
- **What to show:** System reports and alerts
- **Highlights:**
  - Below-par alerts (items needing reorder)
  - Suggested orders
  - Usage trends
  - Stock status summary

### 7. **Settings** (System Configuration)
- **What to show:** Configuration options
- **Highlights:**
  - Category management
  - Vendor management
  - Par level settings
  - User management

---

## Demo Data Highlights

The generated demo data includes:
- **Realistic items:** Cleaning supplies, linens, electronics, tools, etc.
- **Multiple locations:** Storerooms, guest rooms, closets, housekeeping carts
- **Active workflows:** Requisitions in various states, completed counts
- **Stock levels:** Mix of above-par (green), at-par (amber), and below-par (red) items
- **Transaction history:** Past transfers, issues, and adjustments

---

## Troubleshooting

### No Data Showing?
- Make sure you ran the `generate_test_data` command
- Check that both servers are running
- Refresh the browser page

### Can't Login?
- Verify the username is `Scorpious` (case-sensitive)
- Password is `L8Rb1tch` (case-sensitive)
- If user doesn't exist, run:
  ```powershell
  cd backend
  .\venv\Scripts\python.exe manage.py create_scorpious_user
  ```

### Servers Won't Start?
- Check that ports 8000 and 3001 are available
- Verify Python virtual environment is activated
- Check `npm install` was run in frontend directory

### Want Fresh Demo Data?
Run the generate command with `--clear` flag:
```powershell
cd backend
.\venv\Scripts\python.exe manage.py generate_test_data --clear --categories 15 --vendors 10 --locations 20 --items 200 --requisitions 50 --count-sessions 20 --purchase-requests 30 --transactions 100
```

---

## Key Features to Emphasize

✅ **Visual tile-based UI** - Mobile-friendly, intuitive interface  
✅ **Multi-location tracking** - Track inventory across properties, buildings, rooms  
✅ **Real-time stock calculations** - Available quantity = On-hand - Reserved  
✅ **Par level monitoring** - Automatic alerts when stock is low  
✅ **Complete workflow** - Requisitions, receiving, counting, reporting  
✅ **Audit trail** - All transactions are logged  
✅ **Status indicators** - Color-coded (Green/Amber/Red) for quick status assessment  

---

## Next Steps

After the demo, you can:
- Explore different modules in detail
- Show specific workflows end-to-end
- Demonstrate reporting capabilities
- Explain integration points with other systems

---

**Need Help?** Check the main README.md or START-HERE.md for detailed setup instructions.

