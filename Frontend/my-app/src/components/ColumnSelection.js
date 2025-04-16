import React from 'react';

function ColumnSelection({ columns, selectedColumns, setSelectedColumns }) {
  const toggleColumn = (columnName) => {
    if (selectedColumns.includes(columnName)) {
      setSelectedColumns(selectedColumns.filter(col => col !== columnName));
    } else {
      setSelectedColumns([...selectedColumns, columnName]);
    }
  };

  const toggleAllColumns = () => {
    if (selectedColumns.length === columns.length) {
      setSelectedColumns([]);
    } else {
      setSelectedColumns(columns.map(col => col.name));
    }
  };

  return (
    <div className="column-selection">
      <h3>Select Columns</h3>
      <div className="select-all">
        <label>
          <input
            type="checkbox"
            checked={columns.length > 0 && selectedColumns.length === columns.length}
            onChange={toggleAllColumns}
          />
          Select All
        </label>
      </div>
      <div className="columns-container">
        {columns.map((column) => (
          <div key={column.name} className="column-item">
            <label>
              <input
                type="checkbox"
                checked={selectedColumns.includes(column.name)}
                onChange={() => toggleColumn(column.name)}
              />
              {column.name} <span className="column-type">({column.type})</span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ColumnSelection;