import React from 'react';

function DataPreview({ data }) {
  if (!data || data.length === 0) {
    return <div className="data-preview empty">No data to preview</div>;
  }

  // Get all column names from the first data object
  const columns = Object.keys(data[0]);
  
  return (
    <div className="data-preview">
      <h3>Data Preview</h3>
      <div className="preview-table-container">
        <table className="preview-table">
          <thead>
            <tr>
              {columns.map(column => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 10).map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map(column => (
                  <td key={`${rowIndex}-${column}`}>
                    {row[column] !== null && row[column] !== undefined ? String(row[column]) : ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.length > 10 && (
        <p className="preview-note">Showing first 10 of {data.length} records</p>
      )}
    </div>
  );
}

export default DataPreview;