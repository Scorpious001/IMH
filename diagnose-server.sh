#!/bin/bash
# Server Diagnostics Script
# Run this on your EC2 server to check everything

echo "=== IMH IMS Server Diagnostics ==="
echo ""

echo "1. Service Status:"
echo "   Nginx:" 
sudo systemctl is-active nginx
echo "   Gunicorn:"
sudo systemctl is-active imh-ims
echo ""

echo "2. Port 80 Status:"
sudo netstat -tlnp 2>/dev/null | grep :80 || sudo ss -tlnp | grep :80
echo ""

echo "3. Nginx Configuration:"
sudo nginx -t
echo ""

echo "4. Frontend Files:"
ls -la ~/SPS-IMH/frontend-build/index.html 2>&1
echo ""

echo "5. Nginx Error Log (last 10 lines):"
sudo tail -10 /var/log/nginx/error.log 2>/dev/null || echo "No error log"
echo ""

echo "6. Gunicorn Log (last 10 lines):"
sudo journalctl -u imh-ims -n 10 --no-pager 2>/dev/null || echo "No gunicorn log"
echo ""

echo "7. Memory Usage:"
free -h
echo ""

echo "8. Test from server:"
curl -s http://localhost/ | head -3
echo ""

echo "=== Diagnostics Complete ==="
