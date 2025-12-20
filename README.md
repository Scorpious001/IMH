# IMH IMS - Inventory Management System

A comprehensive inventory management system for Property Management Systems, featuring visual tile-based UI, multi-location inventory tracking, requisitions, receiving, cycle counts, and integration capabilities.

## Technology Stack

- **Backend**: Django + Django REST Framework
- **Frontend**: React with TypeScript
- **Database**: SQLite (standalone, no server required)
- **Authentication**: Django's built-in auth system

## Project Structure

```
IMH/
├── backend/              # Django project
│   ├── imh_ims/         # Main Django app with models and services
│   ├── api/             # REST API endpoints
│   └── manage.py
├── frontend/            # React application
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API service layer
│   │   └── types/       # TypeScript interfaces
└── README.md
```

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
# On Windows:
.\venv\Scripts\Activate.ps1
# On macOS/Linux:
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run migrations:
```bash
python manage.py migrate
```

5. Create a superuser (optional):
```bash
python manage.py createsuperuser
```

6. Start the development server:
```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000/api/`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend will be available at `http://localhost:3000`

## Features

### Core Modules

1. **Catalog** - Browse items with visual tiles, search, and filters
2. **Stock by Location** - Hierarchical view of inventory across locations
3. **Requisitions** - Internal request system for stock movements
4. **Receiving** - Receive items from vendors
5. **Counts** - Cycle count and physical inventory management
6. **Reports & Alerts** - Below-par alerts, suggested orders, usage analytics
7. **Settings** - Manage categories, vendors, and par levels

### Key Features

- Visual tile-based UI optimized for mobile
- Color-coded status indicators (Green/Amber/Red)
- Real-time stock tracking across multiple locations
- Par level management with automatic alerts
- Requisition workflow with pick mode
- Cycle count sessions with variance handling
- Suggested order calculations based on usage and lead times
- Integration points for Floor Plan IMS, Housekeeping, and Maintenance

## API Endpoints

### Items
- `GET /api/items/` - List items with filters
- `GET /api/items/{id}/` - Item detail
- `GET /api/items/{id}/usage/` - Usage history
- `GET /api/items/{id}/stock_by_location/` - Stock by location

### Locations
- `GET /api/locations/` - List locations
- `GET /api/locations/tree/` - Hierarchical tree
- `GET /api/locations/{id}/stock/` - Stock at location

### Stock Operations
- `POST /api/stock/transfer/` - Transfer between locations
- `POST /api/stock/issue/` - Issue from location
- `POST /api/stock/adjust/` - Manual adjustment

### Requisitions
- `GET /api/requisitions/` - List requisitions
- `POST /api/requisitions/` - Create requisition
- `POST /api/requisitions/{id}/pick/` - Pick items
- `POST /api/requisitions/{id}/complete/` - Complete requisition

### Receiving
- `POST /api/receiving/receive/` - Receive items
- `GET /api/receiving/history/` - Receiving history

### Counts
- `GET /api/counts/sessions/` - List count sessions
- `POST /api/counts/sessions/` - Start count session
- `POST /api/counts/sessions/{id}/lines/` - Add count line
- `POST /api/counts/sessions/{id}/complete/` - Complete count
- `POST /api/counts/sessions/{id}/approve/` - Approve count

### Reports
- `GET /api/reports/alerts/` - Below-par alerts
- `GET /api/reports/suggested-orders/` - Suggested orders
- `GET /api/reports/usage-trends/` - Usage analytics

## Development Status

✅ Completed:
- Backend API with all core endpoints
- Data models and migrations
- Business logic services
- Frontend structure and routing
- Shared components (StatusIndicator, QuantityStepper, MobileTile, PhotoUpload)
- Catalog page with basic functionality
- Stock by Location page structure
- Navigation system

🚧 In Progress / TODO:
- Complete implementation of all pages (Requisitions, Receiving, Counts, Reports, Settings)
- Authentication system
- Mobile optimizations
- Floor Plan IMS integration
- Usage charts and analytics
- Barcode scanning support

## License

This project is part of a Property Management System implementation.

