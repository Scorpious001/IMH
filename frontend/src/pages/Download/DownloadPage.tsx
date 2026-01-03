import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import './DownloadPage.css';

interface AppVersion {
  version: string;
  buildNumber: string;
  releaseDate: string;
  size: string;
}

const DownloadPage: React.FC = () => {
  const [version, setVersion] = useState<AppVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect mobile device
    const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(mobile);

    // Fetch version info
    fetch('/api/app/version/')
      .then(res => res.json())
      .then(data => {
        setVersion(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching version:', err);
        setLoading(false);
      });
  }, []);

  const handleDownload = () => {
    // Direct download link
    window.location.href = '/api/app/download/';
  };

  const downloadUrl = `${window.location.origin}/api/app/download/`;

  return (
    <div className="download-page">
      <div className="download-container">
        <div className="download-header">
          <div className="app-icon">📱</div>
          <h1>IMH IMS Mobile App</h1>
          <p className="app-description">
            Download the native Android app for the best mobile experience with full camera support for QR code scanning.
          </p>
        </div>

        {loading ? (
          <div className="loading-section">
            <div className="loading-spinner"></div>
            <p>Loading app information...</p>
          </div>
        ) : (
          <>
            {version && (
              <div className="version-info">
                <div className="version-badge">Version {version.version}</div>
                <div className="version-details">
                  <span>Build {version.buildNumber}</span>
                  {version.releaseDate && <span>Released {new Date(version.releaseDate).toLocaleDateString()}</span>}
                  {version.size && <span>Size: {version.size}</span>}
                </div>
              </div>
            )}

            <div className="download-section">
              <h2>Download for Android</h2>
              <button 
                onClick={handleDownload}
                className="download-button"
                aria-label="Download Android APK"
              >
                <span className="download-icon">⬇️</span>
                Download APK
              </button>
              
              {isMobile && (
                <div className="mobile-instructions">
                  <h3>Installation Instructions:</h3>
                  <ol>
                    <li>Tap the download button above</li>
                    <li>When download completes, tap the notification or open Downloads</li>
                    <li>Tap the APK file to install</li>
                    <li>If prompted, allow "Install from unknown sources"</li>
                    <li>Follow the installation prompts</li>
                  </ol>
                  <p className="security-note">
                    <strong>Note:</strong> You may need to enable "Install from unknown sources" in your Android settings.
                    This is safe for apps downloaded directly from this website.
                  </p>
                </div>
              )}

              {!isMobile && (
                <div className="desktop-instructions">
                  <p>
                    <strong>On your Android device:</strong>
                  </p>
                  <ol>
                    <li>Scan the QR code below with your phone's camera</li>
                    <li>Or copy the download link and open it on your device</li>
                    <li>Follow the installation instructions on your device</li>
                  </ol>
                </div>
              )}
            </div>

            <div className="qr-section">
              <h3>Quick Access QR Code</h3>
              <p>Scan this code with your mobile device to open the download page:</p>
              <div className="qr-code-container">
                <QRCodeSVG 
                  value={downloadUrl}
                  size={200}
                  level="M"
                  includeMargin={true}
                />
              </div>
              <p className="qr-url">{downloadUrl}</p>
            </div>

            <div className="features-section">
              <h2>App Features</h2>
              <ul className="features-list">
                <li>✅ Full camera support for QR code scanning</li>
                <li>✅ Works without HTTPS requirement</li>
                <li>✅ Native performance and smooth UI</li>
                <li>✅ Offline capability (coming soon)</li>
                <li>✅ Push notifications (coming soon)</li>
                <li>✅ All features from the web app</li>
              </ul>
            </div>

            <div className="support-section">
              <h2>Need Help?</h2>
              <p>
                If you encounter any issues during installation or have questions about the app,
                please contact your system administrator.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DownloadPage;
