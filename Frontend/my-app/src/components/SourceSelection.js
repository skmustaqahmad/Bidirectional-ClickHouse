import React from 'react';

function SourceSelection({ onSelect }) {
  return (
    <div className="source-selection">
      <h3>Select Data Source</h3>
      <div className="button-group">
        <button onClick={() => onSelect('clickhouse')}>ClickHouse</button>
        <button onClick={() => onSelect('flatfile')}>Flat File</button>
      </div>
    </div>
  );
}

export default SourceSelection;