import React, { useRef, useState } from 'react';
import './PhotoUpload.css';

interface PhotoUploadProps {
  currentUrl?: string;
  onUpload: (file: File) => void;
  onRemove?: () => void;
  disabled?: boolean;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({
  currentUrl,
  onUpload,
  onRemove,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl || null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      onUpload(file);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onRemove) {
      onRemove();
    }
  };

  return (
    <div className="photo-upload">
      {preview ? (
        <div className="photo-preview">
          <img src={preview} alt="Preview" />
          <div className="photo-actions">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="photo-action-button"
            >
              Change
            </button>
            {onRemove && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={disabled}
                className="photo-action-button photo-action-remove"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      ) : (
        <div
          className="photo-upload-placeholder"
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <span className="photo-upload-icon">📷</span>
          <span className="photo-upload-text">Click to upload photo</span>
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={disabled}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default PhotoUpload;

