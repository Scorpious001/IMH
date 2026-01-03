"""
QR Code generation service using industry-standard qrcode library
"""
import qrcode
from io import BytesIO
from django.http import HttpResponse
from PIL import Image


def generate_qr_code(data: str, size: int = 200, error_correction: str = 'M') -> Image.Image:
    """
    Generate QR code image from data using industry-standard settings.
    
    Args:
        data: String data to encode (typically item short_code)
        size: Output image size in pixels (default: 200)
        error_correction: Error correction level - L, M, Q, H (default: M)
    
    Returns:
        PIL Image object
    """
    # Map error correction string to constants
    error_map = {
        'L': qrcode.constants.ERROR_CORRECT_L,  # ~7% error correction
        'M': qrcode.constants.ERROR_CORRECT_M,  # ~15% error correction (industry standard)
        'Q': qrcode.constants.ERROR_CORRECT_Q,  # ~25% error correction
        'H': qrcode.constants.ERROR_CORRECT_H,  # ~30% error correction
    }
    
    error_level = error_map.get(error_correction.upper(), qrcode.constants.ERROR_CORRECT_M)
    
    # Create QR code with industry-standard settings
    qr = qrcode.QRCode(
        version=1,  # Auto-detect version based on data
        error_correction=error_level,
        box_size=10,  # Pixels per box
        border=4,  # Border boxes (industry standard: 4)
    )
    
    qr.add_data(data)
    qr.make(fit=True)
    
    # Generate image with standard black/white colors
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Resize if needed (maintains quality)
    if size != 200:
        img = img.resize((size, size), Image.Resampling.LANCZOS)
    
    return img


def generate_qr_code_response(data: str, size: int = 200, error_correction: str = 'M') -> HttpResponse:
    """
    Generate QR code and return as HTTP response (PNG image).
    
    Args:
        data: String data to encode
        size: Output image size in pixels
        error_correction: Error correction level
    
    Returns:
        HttpResponse with PNG image
    """
    img = generate_qr_code(data, size, error_correction)
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    
    response = HttpResponse(buffer.read(), content_type='image/png')
    response['Content-Disposition'] = f'inline; filename="qr-{data}.png"'
    response['Cache-Control'] = 'public, max-age=3600'  # Cache for 1 hour
    return response


def generate_qr_code_base64(data: str, size: int = 200, error_correction: str = 'M') -> str:
    """
    Generate QR code and return as base64-encoded string.
    Useful for embedding in JSON responses or HTML.
    
    Args:
        data: String data to encode
        size: Output image size in pixels
        error_correction: Error correction level
    
    Returns:
        Base64-encoded PNG image string
    """
    import base64
    
    img = generate_qr_code(data, size, error_correction)
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    
    return base64.b64encode(buffer.getvalue()).decode('utf-8')
