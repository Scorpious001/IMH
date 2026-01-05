# Seed Data Guide

This guide explains how to generate comprehensive seed data for the IMH IMS system.

## Quick Start

### Option 1: PowerShell Script (Recommended)

```powershell
# Generate seed data (keeps existing data)
.\seed-data.ps1

# Clear all data and generate fresh seed data
.\seed-data.ps1 -Clear
```

### Option 2: Django Management Command

```powershell
cd backend
.\venv\Scripts\python.exe manage.py seed_data

# To clear existing data first:
.\venv\Scripts\python.exe manage.py seed_data --clear
```

## What Gets Created

The seed data command creates a comprehensive dataset:

### Users (4 users)
- **admin** / admin123 (Superuser)
- **manager** / manager123 (Admin profile)
- **staff1** / staff123 (Regular user)
- **staff2** / staff123 (Regular user)

### Categories (~35 categories)
- Hierarchical category structure
- Includes: Cleaning Supplies, Linens, Electronics, Furniture, Appliances, Safety Equipment, Office Supplies, Food & Beverage, Medical Supplies, Maintenance Supplies
- Subcategories for major categories

### Vendors (15 vendors)
- Realistic vendor names
- Contact information
- All active

### Locations (~40 locations)
- 4 Main storerooms
- Multiple room types (Guest Rooms, Suites, Conference Rooms, Offices, etc.)
- 10 Supply closets
- 5 Housekeeping carts
- Organized by property

### Items (~80+ items)
- Common hospitality items (toilet paper, linens, cleaning supplies, etc.)
- Realistic short codes
- Proper categorization
- Vendor assignments
- Cost and lead time data

### Stock Levels (~200+ stock levels)
- Stock in main storerooms (higher quantities)
- Stock in various locations
- **30% of items are below par level** (for alerts testing)
- Par levels set appropriately
- Some items at risk (80-100% of par)

### Transactions (500 transactions)
- Historical transactions over the past year
- Mix of ISSUE, RECEIVE, TRANSFER, and ADJUST types
- Realistic quantities and timestamps
- Creates usage trends for reports

### Requisitions (100 requisitions)
- Various statuses (PENDING, PICKED, COMPLETED, CANCELLED)
- Multiple items per requisition
- Historical data over past 6 months

### Count Sessions (50 count sessions)
- Various statuses (IN_PROGRESS, COMPLETED, APPROVED)
- Count lines with realistic variances
- Historical data over past 6 months

### Purchase Requests (75 purchase requests)
- Various statuses (DRAFT, SUBMITTED, APPROVED, ORDERED, RECEIVED)
- Multiple items per request
- Historical data over past 6 months

## Features of the Seed Data

1. **Realistic Relationships**: All data is properly linked (items to categories, stock to locations, etc.)

2. **Alerts Ready**: 30% of stock levels are below par, so the alerts page will show data immediately

3. **Usage Trends**: 500 transactions create realistic usage patterns for the reports page

4. **Complete Coverage**: All major features of the system have data to demonstrate

5. **Historical Data**: Transactions, requisitions, and counts span the past 6-12 months

## Testing Reports & Alerts

After seeding:
- **Reports Page**: Will show usage trends, alerts, and charts
- **Alerts Section**: Will show items below par and at risk
- **General Usage Chart**: Will display usage over time
- **Low Par Trends**: Will show historical par level trends
- **Suggested Orders**: Will suggest orders based on par levels

## Customization

To customize the seed data, edit:
- `backend/imh_ims/management/commands/seed_data.py`

You can modify:
- Number of items created
- Percentage of items below par
- Number of transactions
- Date ranges
- Category structure
- etc.

## Server Deployment

To seed data on the EC2 server:

```bash
ssh -i "path/to/key.pem" ubuntu@3.234.249.243
cd ~/SPS-IMH/backend
source venv/bin/activate
python manage.py seed_data --clear
```

## Notes

- The seed data is designed to be realistic and comprehensive
- It includes some items below par specifically for testing alerts
- All users have the password format: `{username}123`
- Data spans realistic time periods for trend analysis
- Stock levels are distributed across multiple locations
