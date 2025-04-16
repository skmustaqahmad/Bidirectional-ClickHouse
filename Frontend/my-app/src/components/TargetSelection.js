import React from 'react';

function TargetSelection({ source, onSelect }) {
  return (
    <div className="target-selection">
      <h3>Select Target Destination</h3>
      <div className="button-group">
        {source === 'clickhouse' ? (
          <button onClick={() => onSelect('flatfile')}>Flat File</button>
        ) : (
          <button onClick={() => onSelect('clickhouse')}>ClickHouse</button>
        )}
      </div>
    </div>
  );
}

export default TargetSelection;
