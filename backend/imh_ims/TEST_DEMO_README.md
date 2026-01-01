# IMH IMS Test Suite Demo

This comprehensive test suite (`test_system_demo.py`) demonstrates all the core functionality of the IMH Inventory Management System.

## Overview

The test suite includes **8 test classes** covering the major features of the system:

### 1. **ItemManagementTests** - Catalog Management
- Creating inventory items with categories and vendors
- Enforcing unique item codes (SKUs)
- Searching items by name or code

### 2. **LocationTests** - Location Hierarchy
- Creating locations (storerooms, closets, rooms, carts)
- Building parent-child location relationships
- Organizing inventory across properties

### 3. **StockLevelTests** - Stock Tracking
- Tracking on-hand and reserved quantities
- Calculating available quantity (on-hand minus reserved)
- Determining stock status (above/below par levels)
- Ensuring unique item-location combinations

### 4. **StockServiceTests** - Stock Operations
- Calculating global on-hand quantities across all locations
- Transferring stock between locations
- Creating transaction records for audit trails

### 5. **RequisitionTests** - Requisition Workflow
- Creating requisitions (internal stock movement requests)
- Picking items from source locations
- Completing requisitions and transferring stock
- Workflow: PENDING → APPROVED → PICKED → COMPLETED

### 6. **CountSessionTests** - Cycle Counting
- Creating count sessions for physical inventory
- Recording counted quantities vs expected quantities
- Calculating variances
- Approving count sessions

### 7. **ReportsTests** - Reporting & Alerts
- Identifying items below par levels (alerts)
- Generating stock status summaries
- Status indicators: Green (above par), Red (below par)

### 8. **IntegrationTest** - End-to-End Workflow
A complete workflow demonstration:
1. **Receive Stock** - Add inventory from vendors
2. **Check Stock Levels** - Verify quantities
3. **Create Requisition** - Request stock movement
4. **Pick Items** - Transfer stock to destination
5. **Complete Requisition** - Finalize the transfer
6. **Run Cycle Count** - Physical inventory verification
7. **Generate Reports** - Review system status

## Key Features Demonstrated

### Stock Management
- Multi-location inventory tracking
- Real-time quantity calculations
- Reserved quantity handling
- Par level monitoring

### Workflow Management
- Requisition approval process
- Pick mode for stock transfers
- Cycle count variance tracking
- Transaction history

### Data Integrity
- Unique constraints (item codes, item-location pairs)
- Validation rules
- Audit trails via transactions

### Business Logic
- Available quantity calculation (on-hand - reserved)
- Stock status determination
- Below-par alerts
- Variance calculations

## Running the Tests

### Prerequisites
1. Django environment set up
2. Database migrations run
3. Dependencies installed (`pip install -r requirements.txt`)

### Run All Tests
```bash
cd backend
python manage.py test imh_ims.test_system_demo
```

### Run Specific Test Class
```bash
python manage.py test imh_ims.test_system_demo.ItemManagementTests
python manage.py test imh_ims.test_system_demo.StockServiceTests
python manage.py test imh_ims.test_system_demo.IntegrationTest
```

### Run Specific Test Method
```bash
python manage.py test imh_ims.test_system_demo.ItemManagementTests.test_create_item
```

## Test Data Structure

The tests create realistic test data:
- **Categories**: Product categories (e.g., "Cleaning Supplies")
- **Vendors**: Supplier information
- **Locations**: Storage locations with hierarchy
- **Items**: Inventory items with SKUs, costs, lead times
- **Stock Levels**: On-hand quantities at each location
- **Users**: Staff and admin users for workflows

## Expected Results

When all tests pass, you should see:
- ✅ All test cases completed successfully
- ✅ No assertion failures
- ✅ Proper transaction handling
- ✅ Data integrity maintained

## System Capabilities Verified

✅ **Inventory Catalog** - Item management with categories and vendors  
✅ **Multi-Location Stock** - Track inventory across multiple locations  
✅ **Stock Transfers** - Move stock between locations with audit trails  
✅ **Requisitions** - Internal stock request workflow  
✅ **Cycle Counting** - Physical inventory verification  
✅ **Reporting** - Below-par alerts and status summaries  
✅ **Workflow Management** - Complete approval and transfer processes  
✅ **Data Integrity** - Constraints and validation rules  

## Integration with API

These tests validate the same business logic used by the REST API endpoints:
- `/api/items/` - Item catalog
- `/api/locations/` - Location management
- `/api/stock/transfer/` - Stock transfers
- `/api/requisitions/` - Requisition workflow
- `/api/counts/` - Cycle counting
- `/api/reports/alerts/` - Below-par alerts

The tests ensure that the core functionality works correctly before API integration.


