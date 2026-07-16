import React from 'react';

export default function UploadSummaryModal({ isOpen, onClose, uploadResult }) {
  if (!isOpen || !uploadResult) return null;

  // Handle standard JSON response vs FastAPI HTTPExceptions
  const isErrorResponse = !uploadResult.success;
  const message = uploadResult.message || (uploadResult.detail && uploadResult.detail.message) || 'Upload processing completed.';
  
  const summary = uploadResult.summary || (uploadResult.detail && uploadResult.detail.summary) || {};
  const {
    bulk_no,
    total_rows = 0,
    successful_rows = 0,
    failed_rows = 0,
    duplicate_rows = 0,
    processing_status = 'Unknown',
    failed_rows_file,
    errors = []
  } = summary;

  const isSuccess = uploadResult.success && processing_status !== 'Failed';

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className={isSuccess ? 'text-success' : 'text-danger'}>
            {isSuccess ? 'Upload Processed' : 'Upload Failed'}
          </h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        
        <div className="modal-body">
          <p className="modal-message">{message}</p>
          
          <div className="summary-stats-grid">
            <div className="stat-card">
              <span className="stat-value">{total_rows}</span>
              <span className="stat-label">Total Rows</span>
            </div>
            <div className={`stat-card ${isSuccess && successful_rows > 0 ? 'success' : ''}`}>
              <span className="stat-value">{successful_rows}</span>
              <span className="stat-label">Successful</span>
            </div>
            <div className={`stat-card ${failed_rows > 0 ? 'danger' : ''}`}>
              <span className="stat-value">{failed_rows}</span>
              <span className="stat-label">Failed/Invalid</span>
            </div>
            <div className={`stat-card ${duplicate_rows > 0 ? 'warning' : ''}`}>
              <span className="stat-value">{duplicate_rows}</span>
              <span className="stat-label">Duplicates</span>
            </div>
          </div>

          {/* Display Header Errors / Server Validation Logs */}
          {errors && errors.length > 0 && (
            <div className="errors-log-container">
              <h3>Schema Validation Log</h3>
              <div className="errors-list">
                {errors.map((err, i) => (
                  <div key={i} className="error-item">
                    {err.row > 0 && <span className="error-row-number">Row {err.row}:</span>}
                    <span className="error-details">{err.error}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Download failed rows button if there are failures */}
          {failed_rows > 0 && failed_rows_file && bulk_no && (
            <div className="failed-download-box">
              <p>One or more rows had validation or duplicate errors. Click the button below to download the detailed report containing all failed rows with their respective error messages.</p>
              <a 
                href={`/api/upload/failed-reports/${bulk_no}`} 
                download 
                className="failed-report-download-btn"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="download-btn-icon">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download Failed Rows Report (.CSV)
              </a>
            </div>
          )}

          {isSuccess && successful_rows > 0 && (
            <div className="success-info-box">
              <p>
                <strong>Transaction Status:</strong> {successful_rows} valid records have been successfully added/committed to the active store database.
              </p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="primary-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
