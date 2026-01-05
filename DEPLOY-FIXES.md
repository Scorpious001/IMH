# Deploy Fixes to EC2 Server

## Issues Found

1. **Items API returning 0 results** - API returns 200 but empty results array
2. **Chart.js errors** - Missing controllers and plugins (fixed in code, needs deployment)
3. **CSS variables error** - Theme CSS issue

## What Needs to be Deployed

### Backend Changes
- Enhanced debugging in `backend/api/views/items.py`
- Fixed permission case sensitivity
- Added system check command

### Frontend Changes  
- Chart.js controller registrations (BarController, LineController, DoughnutController, Filler)
- Enhanced items API logging
- Improved error handling

## Deployment Steps

1. **Pull latest code on EC2:**
   ```bash
   cd /home/ubuntu/SPS-IMH
   git pull
   ```

2. **Restart backend:**
   ```bash
   sudo systemctl restart gunicorn
   # Or if using supervisor:
   sudo supervisorctl restart gunicorn
   ```

3. **Rebuild and deploy frontend:**
   ```bash
   cd frontend
   npm install  # If needed
   npm run build
   # Copy build to nginx static directory
   sudo cp -r build/* /var/www/html/
   ```

4. **Check backend logs:**
   ```bash
   # Check for the new debug messages
   sudo journalctl -u gunicorn -f
   # Or check log file
   tail -f /path/to/gunicorn.log
   ```

## Debugging the Items API Issue

After deploying, check the backend logs for:
- `[ITEMS API] get_queryset count: X`
- `[ITEMS API] After filter_queryset count: X`
- `[ITEMS API] Paginated - page items count: X`
- `[ITEMS API] Serialized items count: X`

These logs will show where items are being filtered out.

## Quick Test

After deployment, refresh the browser and check:
1. Browser console for the new detailed logging
2. Backend logs for the debug messages
3. Network tab to see the actual API response

The enhanced logging will show exactly why 0 items are being returned.
