import React from 'react';

function StatusDisplay({ status, error, result }) {
  const getStatusMessage = () => {
    switch(status) {
      case 'idle':
        return null;
      case 'connecting':
        return 'Connecting to ClickHouse...';
      case 'connected':
        return 'Connected! Select a table to continue.';
      case 'fetching':
        return 'Fetching table columns...';
      case 'columns_loaded':
        return 'Columns loaded! Select columns for ingestion.';
      case 'processing_file':
        return 'Processing file...';
      case 'previewing':
        return 'Generating data preview...';
      case 'preview_complete':
        return 'Preview generated! Configure target to start ingestion.';
      case 'ingesting':
        return 'Data ingestion in progress...';
      case 'completed':
        return 'Ingestion completed successfully!';
      case 'error':
        return `Error: ${error}`;
      default:
        return `Status: ${status}`;
    }
  };

  return (
    <div className="status-display">
      {getStatusMessage() && (
        <div className={`status-message ${status === 'error' ? 'error' : ''}`}>
          {getStatusMessage()}
        </div>
      )}
      
      {result && (
        <div className="result-display">
          <h3>Ingestion Result</h3>
          <p>Total records processed: <strong>{result.recordCount}</strong></p>
          {result.filePath && (
            <p>Output file: <strong>{result.filePath}</strong></p>
          )}
        </div>
      )}
    </div>
  );
}

export default StatusDisplay;
