import React, { useState, useRef } from 'react';
import { itemsService } from '../../services/itemsService';
import { ImportPreviewResponse, ImportResult } from '../../types/item.types';
import './ImportItemsTab.css';

const ImportItemsTab: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreviewResponse | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [showColumnMapping, setShowColumnMapping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // System column names that can be mapped
  const systemColumns = [
    { key: 'name', label: 'Item Name', required: true },
    { key: 'short_code', label: 'Short Code / SKU', required: true },
    { key: 'category', label: 'Category', required: false },
    { key: 'default_vendor', label: 'Vendor / Supplier', required: false },
    { key: 'cost', label: 'Cost', required: false },
    { key: 'unit_of_measure', label: 'Unit of Measure', required: false },
    { key: 'location_name', label: 'Location Name', required: false },
    { key: 'on_hand_qty', label: 'Quantity on Hand', required: false },
    { key: 'par', label: 'Par Level', required: false },
    { key: 'photo_url', label: 'Photo URL', required: false },
    { key: 'lead_time_days', label: 'Lead Time (Days)', required: false },
  ];

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const fileExtension = selectedFile.name.toLowerCase().split('.').pop();
    if (!['csv', 'xlsx', 'xls'].includes(fileExtension || '')) {
      setError('Please select a CSV or Excel file (.csv, .xlsx, .xls)');
      return;
    }

    setFile(selectedFile);
    setPreview(null);
    setImportResult(null);
    setError(null);

    // Automatically load preview
    await loadPreview(selectedFile);
  };

  const loadPreview = async (fileToPreview: File, mapping?: Record<string, string>) => {
    setLoading(true);
    setError(null);
    try {
      const result = await itemsService.bulkImport(fileToPreview, true, mapping);
      if ('preview' in result && result.preview) {
        setPreview(result);
        // Show column mapping if columns don't match expected names
        if (result.original_columns && result.original_columns.length > 0) {
          const needsMapping = result.original_columns.some(col => {
            const normalized = col.toLowerCase().replace(/[^a-z0-9]/g, '_');
            return !['name', 'short_code', 'item_name', 'sku', 'product_name', 'item_code'].includes(normalized);
          });
          setShowColumnMapping(needsMapping && result.valid_rows === 0);
        }
      } else {
        setError('Unexpected response from server');
      }
    } catch (err: any) {
      console.error('Error loading preview:', err);
      let errorMessage = 'Failed to load preview';
      
      if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error') || err.message?.includes('CONNECTION_REFUSED')) {
        errorMessage = 'Cannot connect to server. Please ensure the backend server is running on http://localhost:8000';
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    try {
      const result = await itemsService.bulkImport(file, false, Object.keys(columnMapping).length > 0 ? columnMapping : undefined);
      if ('items_created' in result) {
        setImportResult(result);
        setPreview(null);
        setColumnMapping({});
        setShowColumnMapping(false);
      } else {
        setError('Unexpected response from server');
      }
    } catch (err: any) {
      console.error('Error importing:', err);
      let errorMessage = 'Failed to import items';
      
      if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error') || err.message?.includes('CONNECTION_REFUSED')) {
        errorMessage = 'Cannot connect to server. Please ensure the backend server is running on http://localhost:8000';
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleColumnMappingChange = (systemColumn: string, fileColumn: string) => {
    const newMapping = { ...columnMapping };
    if (fileColumn) {
      newMapping[fileColumn] = systemColumn;
    } else {
      // Remove mapping
      Object.keys(newMapping).forEach(key => {
        if (newMapping[key] === systemColumn) {
          delete newMapping[key];
        }
      });
    }
    setColumnMapping(newMapping);
  };

  const applyColumnMapping = async () => {
    if (!file) return;
    await loadPreview(file, columnMapping);
    setShowColumnMapping(false);
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setImportResult(null);
    setError(null);
    setColumnMapping({});
    setShowColumnMapping(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const canImport = preview && preview.valid_rows > 0 && !loading;

  return (
    <div className="import-items-tab">
      <div className="settings-section">
        <h3>Import Items from Spreadsheet</h3>
        <p className="section-description">
          Upload a CSV or Excel file to bulk import inventory items. The system will automatically create locations if they don't exist.
        </p>

        {!preview && !importResult && (
          <div className="file-upload-area">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              className="file-input"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="file-upload-label">
              <span className="upload-icon">📁</span>
              <span>Choose a file or drag it here</span>
              <span className="file-types">CSV, XLSX, or XLS</span>
            </label>
          </div>
        )}

        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        )}

        {loading && (
          <div className="loading-message">
            {preview ? 'Importing items...' : 'Loading preview...'}
          </div>
        )}

        {preview && preview.original_columns && preview.original_columns.length > 0 && (
          <div className="column-mapping-section">
            <h4>Column Mapping</h4>
            <p className="section-description">
              Map your file columns to system columns. The system will try to auto-detect matches, but you can adjust them here.
            </p>
            <div className="column-mapping-table">
              <table>
                <thead>
                  <tr>
                    <th>System Column</th>
                    <th>Your File Column</th>
                  </tr>
                </thead>
                <tbody>
                  {systemColumns.map(sysCol => (
                    <tr key={sysCol.key}>
                      <td>
                        {sysCol.label}
                        {sysCol.required && <span className="required-asterisk">*</span>}
                      </td>
                      <td>
                        <select
                          value={Object.keys(columnMapping).find(key => columnMapping[key] === sysCol.key) || ''}
                          onChange={(e) => handleColumnMappingChange(sysCol.key, e.target.value)}
                        >
                          <option value="">-- Auto-detect --</option>
                          {preview.original_columns?.map(col => (
                            <option key={col} value={col}>
                              {col}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mapping-actions">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={applyColumnMapping}
                  disabled={loading}
                >
                  Apply Mapping & Reload Preview
                </button>
              </div>
            </div>
          </div>
        )}

        {preview && (
          <div className="preview-section">
            <div className="preview-summary">
              <div className="summary-item">
                <span className="summary-label">Total Rows:</span>
                <span className="summary-value">{preview.total_rows}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Valid:</span>
                <span className="summary-value valid">{preview.valid_rows}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Invalid:</span>
                <span className="summary-value invalid">{preview.invalid_rows}</span>
              </div>
            </div>

            {preview.invalid_rows > 0 && (
              <div className="validation-errors">
                <h4>Validation Errors</h4>
                {preview.errors.map((errorRow, idx) => (
                  <div key={idx} className="error-row">
                    <strong>Row {errorRow.row_number}:</strong>
                    <ul>
                      {errorRow.errors.map((err, errIdx) => (
                        <li key={errIdx}>{err}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {preview.valid_rows > 0 && (
              <div className="preview-table-container">
                <h4>Preview (showing first 20 rows)</h4>
                <table className="preview-table">
                  <thead>
                    <tr>
                      <th>Row</th>
                      <th>Name</th>
                      <th>Short Code</th>
                      <th>Category</th>
                      <th>Vendor</th>
                      <th>Location</th>
                      <th>Qty</th>
                      <th>Par Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.slice(0, 20).map((row, idx) => (
                      <tr key={idx}>
                        <td>{row.row_number}</td>
                        <td>{row.data.name}</td>
                        <td>{row.data.short_code}</td>
                        <td>{row.data.category || '-'}</td>
                        <td>{row.data.default_vendor || '-'}</td>
                        <td>{row.data.location_name || '-'}</td>
                        <td>{row.data.on_hand_qty != null && row.data.on_hand_qty !== undefined ? row.data.on_hand_qty : '-'}</td>
                        <td>{row.data.par != null && row.data.par !== undefined ? row.data.par : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.rows.length > 20 && (
                  <p className="preview-note">... and {preview.rows.length - 20} more rows</p>
                )}
              </div>
            )}

            <div className="import-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleReset}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleImport}
                disabled={!canImport}
              >
                Import {preview.valid_rows} Item{preview.valid_rows !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        )}

        {importResult && (
          <div className="import-results">
            <h4>Import Complete</h4>
            <div className="results-summary">
              <div className="result-item success">
                <span className="result-label">Items Created:</span>
                <span className="result-value">{importResult.items_created}</span>
              </div>
              <div className="result-item success">
                <span className="result-label">Items Updated:</span>
                <span className="result-value">{importResult.items_updated}</span>
              </div>
              <div className="result-item success">
                <span className="result-label">Vendors Created:</span>
                <span className="result-value">{importResult.vendors_created || 0}</span>
              </div>
              <div className="result-item success">
                <span className="result-label">Locations Created:</span>
                <span className="result-value">{importResult.locations_created}</span>
              </div>
              <div className="result-item success">
                <span className="result-label">Stock Levels Created:</span>
                <span className="result-value">{importResult.stock_levels_created}</span>
              </div>
              <div className="result-item success">
                <span className="result-label">Stock Levels Updated:</span>
                <span className="result-value">{importResult.stock_levels_updated}</span>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div className="import-errors">
                <h5>Errors During Import:</h5>
                {importResult.errors.map((errorRow, idx) => (
                  <div key={idx} className="error-row">
                    <strong>Row {errorRow.row_number}:</strong>
                    <ul>
                      {errorRow.errors.map((err, errIdx) => (
                        <li key={errIdx}>{err}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            <div className="import-actions">
              <button
                type="button"
                className="btn-primary"
                onClick={handleReset}
              >
                Import Another File
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="settings-section">
        <h3>Spreadsheet Format</h3>
        <p className="section-description">
          Your spreadsheet should include the following columns:
        </p>
        <div className="format-info">
          <div className="format-section">
            <h5>Required Columns:</h5>
            <ul>
              <li><strong>name</strong> - Item name</li>
              <li><strong>short_code</strong> - Unique item code/SKU</li>
            </ul>
          </div>
          <div className="format-section">
            <h5>Optional Item Columns:</h5>
            <ul>
              <li><strong>category</strong> - Category name or ID</li>
              <li><strong>default_vendor</strong> - Vendor name or ID</li>
              <li><strong>photo_url</strong> - URL to item photo</li>
              <li><strong>unit_of_measure</strong> - Unit (default: 'ea')</li>
              <li><strong>cost</strong> - Item cost (decimal)</li>
              <li><strong>lead_time_days</strong> - Lead time in days (integer)</li>
              <li><strong>is_active</strong> - true/false (default: true)</li>
            </ul>
          </div>
          <div className="format-section">
            <h5>Optional Location Columns:</h5>
            <ul>
              <li><strong>location_name</strong> - Location name (will be created if doesn't exist)</li>
              <li><strong>location_type</strong> - STOREROOM, CLOSET, CART, ROOM, OTHER (default: STOREROOM)</li>
              <li><strong>location_property_id</strong> - Property identifier</li>
              <li><strong>parent_location_name</strong> - Parent location name (for hierarchy)</li>
            </ul>
          </div>
          <div className="format-section">
            <h5>Optional Stock Columns (requires location_name):</h5>
            <ul>
              <li><strong>on_hand_qty</strong> - Quantity on hand (decimal)</li>
              <li><strong>par</strong> - Par level - stock should be maintained above this level (decimal)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportItemsTab;

