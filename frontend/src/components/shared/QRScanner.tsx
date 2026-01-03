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

      if (!scannerRef.current) {
        setError('Scanner container not found');
        setIsScanning(false);
        return;
      }

      const scannerId = scannerRef.current.id || 'qr-scanner';
      const html5QrCode = new Html5Qrcode(scannerId);
      html5QrCodeRef.current = html5QrCode;

      // Try to get available cameras
      const devices = await Html5Qrcode.getCameras();
      
      if (devices && devices.length === 0) {
        throw new Error('No cameras found');
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
      
      if (err.name === 'NotAllowedError' || err.message?.includes('permission')) {
        errorMessage = 'Camera permission denied. Please allow camera access in your browser settings.';
      } else if (err.name === 'NotFoundError' || err.message?.includes('camera') || err.message?.includes('No cameras')) {
        errorMessage = 'No camera found on this device.';
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
    <div className="qr-scanner-overlay">
      <div className="qr-scanner-container">
        <div className="qr-scanner-header">
          <h2>Scan QR Code</h2>
          <button 
            onClick={async () => { 
              await stopScanning(); 
              onClose?.(); 
            }} 
            className="close-scanner-btn"
            aria-label="Close scanner"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="qr-scanner-error">
            {error}
            {error.includes('permission') || error.includes('camera') ? (
              <button 
                onClick={startScanning} 
                className="retry-camera-btn"
              >
                Retry Camera Access
              </button>
            ) : null}
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
