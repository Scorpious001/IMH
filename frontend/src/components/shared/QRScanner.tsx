import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { itemsService } from '../../services/itemsService';
import { useNavigate } from 'react-router-dom';
import './QRScanner.css';

interface QRScannerProps {
  onScan?: (itemCode: string) => void;
  onClose?: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const manualInputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const navigate = useNavigate();

  // Check if we're on HTTPS
  const isSecureContext = window.isSecureContext || window.location.protocol === 'https:';
  
  // Detect mobile device
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  useEffect(() => {
    let isMounted = true;
    
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      if (isMounted && scannerRef.current) {
        startScanning();
      }
    }, 100);
    
    return () => {
      isMounted = false;
      clearTimeout(timer);
      stopScanning();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startScanning = async () => {
    try {
      setError(null);
      setIsScanning(true);

      // Check for HTTPS requirement on mobile
      if (isMobile && !isSecureContext) {
        throw new Error('HTTPS_REQUIRED');
      }

      if (!scannerRef.current) {
        setError('Scanner container not found');
        setIsScanning(false);
        return;
      }

      const scannerId = scannerRef.current.id || 'qr-scanner';
      const html5QrCode = new Html5Qrcode(scannerId);
      html5QrCodeRef.current = html5QrCode;

      // Try to get available cameras
      let devices: any[] = [];
      try {
        devices = await Html5Qrcode.getCameras();
      } catch (camError: any) {
        console.error('Error getting cameras:', camError);
        if (camError.name === 'NotAllowedError' || camError.message?.includes('permission')) {
          throw new Error('PERMISSION_DENIED');
        }
        if (camError.name === 'NotFoundError' || camError.message?.includes('camera') || camError.message?.includes('No cameras')) {
          throw new Error('NO_CAMERA');
        }
        if (camError.message?.includes('secure') || camError.message?.includes('HTTPS') || camError.message?.includes('getUserMedia')) {
          throw new Error('HTTPS_REQUIRED');
        }
        throw camError;
      }
      
      if (!devices || devices.length === 0) {
        throw new Error('NO_CAMERA');
      }

      // Prefer back camera on mobile, fallback to first available
      let cameraId: string | { facingMode: string } = { facingMode: 'environment' };
      
      // Try to find back camera
      const backCamera = devices.find((device: any) => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear') ||
        device.label.toLowerCase().includes('environment')
      );
      
      if (backCamera) {
        cameraId = backCamera.id;
      } else if (devices.length > 0) {
        // Use first available camera
        cameraId = devices[0].id;
      }

      // Start scanning
      await html5QrCode.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          disableFlip: false,
        },
        (decodedText) => {
          // QR code detected
          handleQRCodeDetected(decodedText);
        },
        (errorMessage) => {
          // Ignore scanning errors (they're frequent during scanning)
          // Only log if it's not a common "not found" error
          if (!errorMessage.includes('No QR code found')) {
            // Silently ignore - these are normal during scanning
          }
        }
      );
    } catch (err: any) {
      console.error('Camera access error:', err);
      let errorMessage = 'Failed to access camera. Please try again.';
      
      if (err.message === 'HTTPS_REQUIRED' || (err.name === 'NotAllowedError' && !isSecureContext)) {
        if (isMobile) {
          errorMessage = 'Camera access requires HTTPS. Mobile browsers block camera access on HTTP connections for security.';
        } else {
          errorMessage = 'Camera access requires HTTPS. Please access this site using HTTPS (https://) instead of HTTP.';
        }
      } else if (err.name === 'NotAllowedError' || err.message === 'PERMISSION_DENIED' || err.message?.includes('permission') || err.message?.includes('Camera permission')) {
        if (isMobile) {
          errorMessage = 'Camera permission denied. Please allow camera access in your device settings:\n\n• iOS: Settings > Safari > Camera\n• Android: Browser settings > Site permissions > Camera';
        } else {
          errorMessage = 'Camera permission denied. Please allow camera access in your browser settings and try again.';
        }
      } else if (err.name === 'NotFoundError' || err.message === 'NO_CAMERA' || err.message?.includes('camera') || err.message?.includes('No cameras')) {
        errorMessage = 'No camera found on this device.';
      } else if (err.message?.includes('secure') || err.message?.includes('HTTPS') || err.message?.includes('getUserMedia')) {
        errorMessage = 'Camera access may require HTTPS. Some browsers block camera access on HTTP connections.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setIsScanning(false);
    }
  };

  const stopScanning = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop().catch((err) => {
          // Ignore errors when stopping (camera might already be stopped)
          console.log('Scanner stop:', err.message || 'Scanner stopped');
        });
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      } finally {
        html5QrCodeRef.current = null;
      }
    }
    setIsScanning(false);
  };

  const handleQRCodeDetected = async (code: string) => {
    if (scannedCode === code) return; // Prevent duplicate scans
    
    setScannedCode(code);
    await stopScanning();

    try {
      const item = await itemsService.lookupByCode(code);
      
      if (onScan) {
        onScan(code);
      } else {
        navigate(`/catalog/${item.id}`);
      }
      
      if (onClose) {
        setTimeout(onClose, 500);
      }
    } catch (err: any) {
      setError(`Item not found: ${code}`);
      // Restart scanning after error
      setTimeout(() => {
        setScannedCode(null);
        startScanning();
      }, 2000);
    }
  };

  const handleManualInput = async (code?: string) => {
    const codeToUse = code || manualCode;
    if (!codeToUse.trim()) {
      setError('Please enter an item code');
      return;
    }

    try {
      setError(null);
      const item = await itemsService.lookupByCode(codeToUse.trim());
      setScannedCode(codeToUse.trim());
      
      await stopScanning();
      
      if (onScan) {
        onScan(codeToUse.trim());
      } else {
        navigate(`/catalog/${item.id}`);
      }
      
      if (onClose) {
        setTimeout(onClose, 500);
      }
    } catch (err: any) {
      setError(`Item not found: ${codeToUse.trim()}`);
      setManualCode(''); // Clear input on error
      if (manualInputRef.current) {
        manualInputRef.current.focus();
      }
    }
  };

  return (
    <div className="qr-scanner-overlay" onClick={(e) => {
      // Close on overlay click (but not on container click)
      if (e.target === e.currentTarget) {
        stopScanning();
        onClose?.();
      }
    }}>
      <div className="qr-scanner-container" onClick={(e) => e.stopPropagation()}>
        <div className="qr-scanner-header">
          <h2>Scan QR Code</h2>
          <button 
            onClick={async () => { 
              await stopScanning(); 
              onClose?.(); 
            }} 
            className="close-scanner-btn"
            aria-label="Close scanner"
            type="button"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="qr-scanner-error">
            <p style={{ whiteSpace: 'pre-line' }}>{error}</p>
            {error.includes('HTTPS') || error.includes('secure') ? (
              <div className="https-warning">
                <p><strong>Note:</strong> Mobile browsers require HTTPS for camera access.</p>
                <p>You can still use the manual code entry below to look up items.</p>
                {isMobile && (
                  <p style={{ marginTop: '8px', fontSize: '0.85em' }}>
                    <strong>Tip:</strong> Ask your administrator to enable HTTPS on the server.
                  </p>
                )}
              </div>
            ) : error.includes('permission') || error.includes('Permission') ? (
              <div className="https-warning">
                <p><strong>How to enable camera access:</strong></p>
                {isMobile ? (
                  <>
                    <p style={{ fontSize: '0.9em', marginTop: '8px' }}>
                      <strong>iOS Safari:</strong> Settings → Safari → Camera → Allow
                    </p>
                    <p style={{ fontSize: '0.9em' }}>
                      <strong>Android Chrome:</strong> Tap the lock icon in address bar → Permissions → Camera → Allow
                    </p>
                  </>
                ) : (
                  <p style={{ fontSize: '0.9em', marginTop: '8px' }}>
                    Click the camera icon in your browser's address bar and allow camera access.
                  </p>
                )}
                <button 
                  onClick={startScanning} 
                  className="retry-camera-btn"
                  style={{ marginTop: '12px' }}
                >
                  Retry Camera Access
                </button>
              </div>
            ) : error.includes('No camera') ? (
              <div className="https-warning">
                <p>This device doesn't have a camera, or the camera is not accessible.</p>
                <p style={{ marginTop: '8px' }}>You can still use the manual code entry below.</p>
              </div>
            ) : (
              <button 
                onClick={startScanning} 
                className="retry-camera-btn"
              >
                Retry Camera Access
              </button>
            )}
          </div>
        )}

        <div className="qr-scanner-video-container">
          {!isScanning && !error && (
            <div className="qr-scanner-loading">
              <div className="loading-spinner"></div>
              <p>Initializing camera...</p>
            </div>
          )}
          <div id="qr-scanner" ref={scannerRef} className="qr-scanner" />
          {isScanning && (
            <div className="qr-scanner-overlay-frame">
              <p className="scan-instructions">Position QR code within the frame</p>
            </div>
          )}
        </div>

        <div className="qr-scanner-manual-input">
          <label>Or enter code manually:</label>
          <div className="manual-input-wrapper">
            <input
              ref={manualInputRef}
              type="text"
              placeholder="Enter item code"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleManualInput();
                }
              }}
              className="manual-code-input"
            />
            <button
              onClick={() => handleManualInput()}
              className="manual-submit-btn"
              disabled={!manualCode.trim()}
            >
              Lookup
            </button>
          </div>
        </div>

        {scannedCode && (
          <div className="qr-scanner-success">
            Scanned: {scannedCode}
          </div>
        )}
      </div>
    </div>
  );
};

export default QRScanner;
