import os
from django.http import FileResponse, JsonResponse
from django.conf import settings
from django.views import View
from django.utils import timezone
import json

class AppDownloadView(View):
    """
    Serve the Android APK file for download.
    """
    def get(self, request):
        apps_dir = os.path.join(settings.MEDIA_ROOT, 'apps')
        # Ensure apps directory exists
        os.makedirs(apps_dir, exist_ok=True)
        
        apk_path = os.path.join(apps_dir, 'imh-ims.apk')
        
        if not os.path.exists(apk_path):
            return JsonResponse(
                {'error': 'APK file not found. Please contact administrator.'},
                status=404
            )
        
        # Get file info
        file_size = os.path.getsize(apk_path)
        file_name = 'imh-ims.apk'
        
        # Serve file with proper headers
        response = FileResponse(
            open(apk_path, 'rb'),
            content_type='application/vnd.android.package-archive',
            as_attachment=True,
            filename=file_name
        )
        
        # Add security headers
        response['Content-Disposition'] = f'attachment; filename="{file_name}"'
        response['Content-Length'] = file_size
        response['X-Content-Type-Options'] = 'nosniff'
        response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response['Pragma'] = 'no-cache'
        response['Expires'] = '0'
        
        return response


class AppVersionView(View):
    """
    Return app version information.
    """
    def get(self, request):
        # Try to read version from package.json in android-app-template
        version_info = {
            'version': '1.0.0',
            'buildNumber': '1',
            'releaseDate': None,
            'size': None
        }
        
        # Try to get version from package.json
        package_json_path = os.path.join(
            settings.BASE_DIR,
            '..',
            'android-app-template',
            'package.json'
        )
        
        if os.path.exists(package_json_path):
            try:
                with open(package_json_path, 'r') as f:
                    package_data = json.load(f)
                    version_info['version'] = package_data.get('version', '1.0.0')
            except Exception as e:
                print(f"Error reading package.json: {e}")
        
        # Try to get app.json info
        app_json_path = os.path.join(
            settings.BASE_DIR,
            '..',
            'android-app-template',
            'app.json'
        )
        
        if os.path.exists(app_json_path):
            try:
                with open(app_json_path, 'r') as f:
                    app_data = json.load(f)
                    version_info['buildNumber'] = app_data.get('buildNumber', '1')
            except Exception as e:
                print(f"Error reading app.json: {e}")
        
        # Get APK file size if it exists
        apk_path = os.path.join(settings.MEDIA_ROOT, 'apps', 'imh-ims.apk')
        if os.path.exists(apk_path):
            file_size = os.path.getsize(apk_path)
            # Convert to MB
            size_mb = file_size / (1024 * 1024)
            version_info['size'] = f'{size_mb:.2f} MB'
            
            # Get file modification time as release date
            mtime = os.path.getmtime(apk_path)
            version_info['releaseDate'] = timezone.datetime.fromtimestamp(mtime).isoformat()
        
        return JsonResponse(version_info)
