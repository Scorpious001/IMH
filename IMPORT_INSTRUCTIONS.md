# Inventory Import Instructions

## Overview
The Import Items feature allows administrators to bulk import inventory items from CSV or Excel spreadsheets. The system will automatically create locations if they don't exist.

## Access
- Navigate to **Settings** → **Import Items** (admin-only)
- Only users with ADMIN role can access this feature

## Spreadsheet Format

### Required Columns
- **name** - Item name (required)
- **short_code** - Unique item code/SKU (required)

### Optional Item Columns
- **category** - Category name or ID (will lookup existing category)
- **default_vendor** - Vendor name or ID (will lookup existing vendor, **will be created if doesn't exist**)
- **vendor_email** - Vendor email address (optional, only used when creating new vendor)
- **vendor_phone** - Vendor phone number (optional, only used when creating new vendor)
- **vendor_contact_info** - Vendor contact information/address (optional, only used when creating new vendor)
- **photo_url** - URL to item photo
- **unit_of_measure** - Unit of measure (default: 'ea')
- **cost** - Item cost as decimal (e.g., 25.50)
- **lead_time_days** - Lead time in days as integer (default: 0)
- **is_active** - true/false or 1/0 (default: true)

### Optional Location Columns
- **location_name** - Location name (will be created if doesn't exist)
- **location_type** - One of: STOREROOM, CLOSET, CART, ROOM, OTHER (default: STOREROOM)
- **location_property_id** - Property identifier for location
- **parent_location_name** - Parent location name (for hierarchical structure)

### Optional Stock Columns (requires location_name)
- **on_hand_qty** - Quantity on hand as decimal (default: 0)
- **par** - Par level as decimal - stock should be maintained above this level (default: 0)

## Column Name Flexibility
Column names are case-insensitive and spaces are automatically converted to underscores. For example:
- "Name" = "name"
- "Short Code" = "short_code"
- "Location Name" = "location_name"

## Import Process

1. **Upload File**: Click the upload area and select your CSV or Excel file
2. **Preview**: The system automatically loads a preview showing:
   - Total rows
   - Valid rows (green)
   - Invalid rows (red) with error messages
   - Preview table of first 20 valid rows
3. **Review Errors**: Fix any validation errors in your spreadsheet
4. **Import**: Click "Import" button to process all valid rows
5. **Results**: View summary of:
   - Items created/updated
   - Vendors created
   - Locations created
   - Stock levels created/updated
   - Any errors that occurred during import

## Behavior

### Items
- If an item with the same `short_code` exists, it will be **updated** with new data
- If `short_code` doesn't exist, a new item will be **created**

### Vendors
- If a vendor with the same name exists, it will be used
- If `default_vendor` doesn't exist, a new vendor will be **created automatically**
- Optional vendor fields (`vendor_email`, `vendor_phone`, `vendor_contact_info`) are only used when creating new vendors

### Locations
- If a location with the same `location_name` exists, it will be used
- If `location_name` doesn't exist, a new location will be **created automatically**
- If `parent_location_name` is provided and doesn't exist, the parent location will also be created

### Stock Levels
- Stock levels are created/updated for each item-location combination
- Requires both `location_name` and item data
- If stock level exists, it will be updated with new quantities
- **Par level** represents the minimum level stock should be maintained at (items should stay above this level)

## Example Spreadsheet

See `backend/import_template.csv` for a complete example with sample data.

## Tips

1. **Start Small**: Test with a few rows first to ensure your format is correct
2. **Check Categories/Vendors**: Make sure category and vendor names match existing ones, or they will be skipped
3. **Location Hierarchy**: Parent locations are created automatically if they don't exist
4. **Data Types**: 
   - Numbers (cost, quantities) should be valid decimals
   - Booleans (is_active) can be: true/false, 1/0, yes/no
   - Integers (lead_time_days) should be whole numbers
5. **Empty Cells**: Empty cells are treated as optional fields and will use defaults

## Troubleshooting

### "Cannot connect to server"
- Ensure the backend server is running on http://localhost:8000
- Check that you've installed dependencies: `pip install pandas openpyxl`

### "Admin permission required"
- Only users with ADMIN role can import items
- Check your user profile role in the Users settings

### Validation Errors
- Review the error messages for each invalid row
- Common issues:
  - Missing required fields (name, short_code)
  - Invalid number formats
  - Invalid location types

### Import Errors
- Some rows may fail during import even if they passed validation
- Check the import results for specific error messages
- Common issues:
  - Database constraints (e.g., duplicate short_code)
  - Foreign key issues (category/vendor not found)

## File Size Limits
- Recommended: Keep files under 10MB for best performance
- Very large files may take longer to process

