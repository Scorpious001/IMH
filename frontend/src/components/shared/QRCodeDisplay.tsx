import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import './QRCodeDisplay.css';

interface QRCodeDisplayProps {
  value: string; // The short_code to encode
  itemName?: string;
  size?: number;
  showActions?: boolean;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ 
  value, 
  itemName, 
  size = 200,
  showActions = true
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadQR = () => {
    setIsDownloading(true);
    try {
      const svg = document.getElementById(`qrcode-svg-${value}`);
      if (!svg) {
        console.error('QR code SVG not found');
        return;
      }
      
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = size;
        canvas.height = size;
        ctx?.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `QR-${value}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }
          setIsDownloading(false);
        }, 'image/png');
      };
      
      img.onerror = () => {
        console.error('Failed to load QR code image');
        setIsDownloading(false);
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    } catch (error) {
      console.error('Error downloading QR code:', error);
      setIsDownloading(false);
    }
  };

  const printQR = () => {
    // Create a print-friendly window
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${value}</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              font-family: Arial, sans-serif;
            }
            .qr-container {
              text-align: center;
            }
            .qr-label {
              margin-top: 20px;
              font-size: 18px;
              font-weight: bold;
            }
            .qr-code {
              margin: 20px 0;
            }
            @media print {
              body { margin: 0; padding: 10px; }
              .qr-container { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div class="qr-label">${itemName || 'Item'}</div>
            <div class="qr-label" style="font-size: 14px; font-weight: normal;">Code: ${value}</div>
            <div class="qr-code">
              ${document.getElementById(`qrcode-svg-${value}`)?.outerHTML || ''}
            </div>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <div className="qr-code-display">
      <div className="qr-code-container">
        <QRCodeSVG
          id={`qrcode-svg-${value}`}
          value={value}
          size={size}
          level="M"
          includeMargin={true}
          className="qr-code-svg"
        />
      </div>
      {itemName && (
        <div className="qr-code-label">
          <div className="qr-item-name">{itemName}</div>
          <div className="qr-item-code">Code: {value}</div>
        </div>
      )}
      {showActions && (
        <div className="qr-code-actions">
          <button 
            onClick={downloadQR} 
            className="download-qr-btn"
            disabled={isDownloading}
          >
            {isDownloading ? 'Downloading...' : 'Download QR Code'}
          </button>
          <button 
            onClick={printQR} 
            className="print-qr-btn"
          >
            Print QR Code
          </button>
        </div>
      )}
    </div>
  );
};

export default QRCodeDisplay;
