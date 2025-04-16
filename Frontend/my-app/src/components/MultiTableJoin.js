import React, { useState, useEffect } from 'react';

function MultiTableJoin({ 
  tables, 
  joinTables, 
  setJoinTables, 
  joinConditions, 
  setJoinConditions,
  sourceConfig,
  setColumns,
  setStatus,
  setError
}) {
  const [selectedTable, setSelectedTable] = useState('');
  const [tableColumns, setTableColumns] = useState({});
  
  useEffect(() => {
    // Load columns for initially selected tables
    async function loadInitialTableColumns() {
      for (const table of joinTables) {
        await fetchTableColumns(table);
      }
    }
    
    if (joinTables.length > 0) {
      loadInitialTableColumns();
    }
  }, []);
  
  const fetchTableColumns = async (tableName) => {
    try {
      const response = await fetch('http://localhost:5000/api/clickhouse/columns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...sourceConfig,
          tableName
        }),
      });

      const data = await response.json();

      if (data.success) {
        setTableColumns(prev => ({
          ...prev,
          [tableName]: data.columns.map(col => col.name)
        }));
        
        // Merge columns from all tables
        const allColumns = [];
        Object.keys(tableColumns).forEach(table => {
          tableColumns[table].forEach(col => {
            const prefixedCol = `${table}.${col}`;
            if (!allColumns.includes(prefixedCol)) {
              allColumns.push({ name: prefixedCol, type: 'String' });
            }
          });
        });
        
        data.columns.forEach(col => {
          const prefixedCol = `${tableName}.${col.name}`;
          if (!allColumns.some(c => c.name === prefixedCol)) {
            allColumns.push({ name: prefixedCol, type: col.type });
          }
        });
        
        setColumns(allColumns);
      } else {
        setError(data.message || 'Failed to fetch columns');
        setStatus('error');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
      setStatus('error');
    }
  };
  
  const addTable = async () => {
    if (selectedTable && !joinTables.includes(selectedTable)) {
      const newJoinTables = [...joinTables, selectedTable];
      setJoinTables(newJoinTables);
      
      // Add empty join condition
      if (newJoinTables.length > 1) {
        setJoinConditions([...joinConditions, '']);
      }
      
      await fetchTableColumns(selectedTable);
      setSelectedTable('');
    }
  };
  
  const removeTable = (index) => {
    // Don't allow removing the first table
    if (index === 0) return;
    
    const newJoinTables = joinTables.filter((_, i) => i !== index);
    setJoinTables(newJoinTables);
    
    // Remove the corresponding join condition
    const newJoinConditions = joinConditions.filter((_, i) => i !== index - 1);
    setJoinConditions(newJoinConditions);
  };
  
  const updateJoinCondition = (index, value) => {
    const newJoinConditions = [...joinConditions];
    newJoinConditions[index] = value;
    setJoinConditions(newJoinConditions);
  };
  
  return (
    <div className="multi-table-join">
      <h3>Multi-Table Join Configuration</h3>
      
      <div className="selected-tables">
        <h4>Selected Tables</h4>
        {joinTables.map((table, index) => (
          <div key={index} className="join-table-item">
            <span>{table}</span>
            {index > 0 && (
              <button onClick={() => removeTable(index)} className="remove-table-btn">✕</button>
            )}
            
            {index > 0 && (
              <div className="join-condition">
                <label>JOIN ON:</label>
                <input
                  type="text"
                  value={joinConditions[index - 1] || ''}
                  onChange={(e) => updateJoinCondition(index - 1, e.target.value)}
                  placeholder={`e.g., ${joinTables[0]}.id = ${table}.id`}
                />
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="add-join-table">
        <select 
          value={selectedTable}
          onChange={(e) => setSelectedTable(e.target.value)}
        >
          <option value="">-- Select Table --</option>
          {tables
            .filter(table => !joinTables.includes(table))
            .map(table => (
              <option key={table} value={table}>{table}</option>
            ))
          }
        </select>
        <button onClick={addTable} disabled={!selectedTable}>Add Table</button>
      </div>
      
      <div className="join-info">
        <p>
          <strong>Note:</strong> When using multi-table join, select columns in the format 
          <code>table_name.column_name</code> in the column selection below.
        </p>
      </div>
    </div>
  );
}

export default MultiTableJoin;