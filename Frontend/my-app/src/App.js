
import React, { useState } from 'react';
import './index.css';
import SourceSelection from './components/SourceSelection';
import ClickHouseSourceForm from './components/ClickHouseSourceForm';
import FlatFileSourceForm from './components/FlatFileSourceForm';
import ColumnSelection from './components/ColumnSelection';
import TargetSelection from './components/TargetSelection';
import ClickHouseTargetForm from './components/ClickHouseTargetForm';
import FlatFileTargetForm from './components/FlatFileTargetForm';
import StatusDisplay from './components/StatusDisplay';
import MultiTableJoin from './components/MultiTableJoin';
import DataPreview from './components/DataPreview';

function App() {
  const [source, setSource] = useState('');
  const [target, setTarget] = useState('');
  const [sourceConfig, setSourceConfig] = useState({});
  const [targetConfig, setTargetConfig] = useState({});
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [columns, setColumns] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [filePath, setFilePath] = useState('');
  const [joinMode, setJoinMode] = useState(false);
  const [joinTables, setJoinTables] = useState([]);
  const [joinConditions, setJoinConditions] = useState([]);

  const handleSourceSelect = (selectedSource) => {
    setSource(selectedSource);
    setTables([]);
    setSelectedTable('');
    setColumns([]);
    setSelectedColumns([]);
    setStatus('idle');
    setResult(null);
    setError(null);
    setPreviewData(null);
    setJoinMode(false);
  };

  const handleTargetSelect = (selectedTarget) => {
    setTarget(selectedTarget);
    setStatus('idle');
    setResult(null);
    setError(null);
  };

  const handleClickHouseConnect = async (config) => {
    try {
      setStatus('connecting');
      setSourceConfig(config);

      const response = await fetch('http://localhost:5000/api/clickhouse/tables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (data.success) {
        setTables(data.tables.map(t => t.name));
        setStatus('connected');
      } else {
        setError(data.message || 'Failed to connect to ClickHouse');
        setStatus('error');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
      setStatus('error');
    }
  };

  const handleTableSelect = async (table) => {
    try {
      setSelectedTable(table);
      setStatus('fetching');

      const response = await fetch('http://localhost:5000/api/clickhouse/columns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...sourceConfig,
          tableName: table
        }),
      });

      const data = await response.json();

      if (data.success) {
        setColumns(data.columns.map(col => ({ name: col.name, type: col.type })));
        setStatus('columns_loaded');
      } else {
        setError(data.message || 'Failed to fetch columns');
        setStatus('error');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
      setStatus('error');
    }
  };

  const handleFileSelect = async (fileConfig) => {
    try {
      setStatus('processing_file');
      setSourceConfig(fileConfig);

      const formData = new FormData();
      formData.append('file', fileConfig.file);
      formData.append('delimiter', fileConfig.delimiter);

      const response = await fetch('http://localhost:5000/api/file/schema', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setColumns(data.columns.map(col => ({ name: col, type: 'String' })));
        setFilePath(data.filePath);
        setStatus('columns_loaded');
      } else {
        setError(data.message || 'Failed to process file');
        setStatus('error');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
      setStatus('error');
    }
  };

  const handlePreview = async () => {
    try {
      if (selectedColumns.length === 0) {
        setError('Please select at least one column');
        return;
      }

      setStatus('previewing');

      let response;
      if (source === 'clickhouse') {
        if (joinMode) {
          response = await fetch('http://localhost:5000/api/clickhouse/join-preview', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...sourceConfig,
              tables: joinTables,
              joinConditions,
              selectedColumns
            }),
          });
        } else {
          response = await fetch('http://localhost:5000/api/clickhouse/preview', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...sourceConfig,
              tableName: selectedTable,
              selectedColumns
            }),
          });
        }
      } else {
        // For flat file, we already have the sample data from schema detection
        // This is a simplified approach; in a real app, you'd create an endpoint to preview file data
        setPreviewData({
          data: [{ message: 'File preview is shown during schema detection' }]
        });
        setStatus('preview_complete');
        return;
      }

      const data = await response.json();

      if (data.success) {
        setPreviewData(data);
        setStatus('preview_complete');
      } else {
        setError(data.message || 'Failed to preview data');
        setStatus('error');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
      setStatus('error');
    }
  };

  const handleStartIngestion = async () => {
    try {
      if (selectedColumns.length === 0) {
        setError('Please select at least one column');
        return;
      }

      if (!target) {
        setError('Please select a target');
        return;
      }

      setStatus('ingesting');
      setResult(null);

      let response;

      if (source === 'clickhouse' && target === 'flatfile') {
        // ClickHouse to Flat File
        if (joinMode) {
          response = await fetch('http://localhost:5000/api/ingest/join-to-file', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...sourceConfig,
              tables: joinTables,
              joinConditions,
              selectedColumns,
              fileName: targetConfig.fileName,
              delimiter: targetConfig.delimiter
            }),
          });
        } else {
          response = await fetch('http://localhost:5000/api/ingest/clickhouse-to-file', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...sourceConfig,
              tableName: selectedTable,
              selectedColumns,
              fileName: targetConfig.fileName,
              delimiter: targetConfig.delimiter
            }),
          });
        }
      } else if (source === 'flatfile' && target === 'clickhouse') {
        // Flat File to ClickHouse
        response = await fetch('http://localhost:5000/api/ingest/file-to-clickhouse', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...targetConfig,
            filePath,
            selectedColumns,
            delimiter: sourceConfig.delimiter
          }),
        });
      } else {
        setError('Invalid source/target combination');
        setStatus('error');
        return;
      }

      const data = await response.json();

      if (data.success) {
        setResult(data);
        setStatus('completed');
      } else {
        setError(data.message || 'Ingestion failed');
        setStatus('error');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
      setStatus('error');
    }
  };

  const toggleJoinMode = () => {
    setJoinMode(!joinMode);
    if (!joinMode) {
      setJoinTables([selectedTable]);
    } else {
      setJoinTables([]);
      setJoinConditions([]);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>ClickHouse & Flat File Data Ingestion Tool</h1>
      </header>
      
      <main className="App-main">
        <div className="configuration-container">
          <h2>Source Configuration</h2>
          <SourceSelection onSelect={handleSourceSelect} />
          
          {source === 'clickhouse' && (
            <div className="clickhouse-source">
              <ClickHouseSourceForm onConnect={handleClickHouseConnect} />
              
              {tables.length > 0 && (
                <div className="table-selector">
                  <h3>Select Table</h3>
                  <select 
                    value={selectedTable} 
                    onChange={(e) => handleTableSelect(e.target.value)}
                  >
                    <option value="">-- Select Table --</option>
                    {tables.map(table => (
                      <option key={table} value={table}>{table}</option>
                    ))}
                  </select>
                  
                  {source === 'clickhouse' && status === 'columns_loaded' && (
                    <div className="join-option">
                      <button 
                        onClick={toggleJoinMode}
                        className={joinMode ? 'active' : ''}
                      >
                        {joinMode ? 'Disable Multi-Table Join' : 'Enable Multi-Table Join'}
                      </button>
                    </div>
                  )}
                  
                  {joinMode && (
                    <MultiTableJoin 
                      tables={tables}
                      joinTables={joinTables}
                      setJoinTables={setJoinTables}
                      joinConditions={joinConditions}
                      setJoinConditions={setJoinConditions}
                      sourceConfig={sourceConfig}
                      setColumns={setColumns}
                      setStatus={setStatus}
                      setError={setError}
                    />
                  )}
                </div>
              )}
            </div>
          )}
          
          {source === 'flatfile' && (
            <FlatFileSourceForm onFileSelect={handleFileSelect} />
          )}
          
          {columns.length > 0 && (
            <ColumnSelection 
              columns={columns} 
              selectedColumns={selectedColumns}
              setSelectedColumns={setSelectedColumns}
            />
          )}
          
          {status === 'columns_loaded' && (
            <div className="preview-section">
              <button onClick={handlePreview} className="preview-button">
                Preview Data
              </button>
            </div>
          )}
          
          {previewData && (
            <DataPreview data={previewData.data} />
          )}
        </div>
        
        {columns.length > 0 && (
          <div className="target-container">
            <h2>Target Configuration</h2>
            <TargetSelection 
              source={source} 
              onSelect={handleTargetSelect} 
            />
            
            {target === 'clickhouse' && (
              <ClickHouseTargetForm 
                onConfigChange={setTargetConfig} 
              />
            )}
            
            {target === 'flatfile' && (
              <FlatFileTargetForm 
                onConfigChange={setTargetConfig} 
              />
            )}
            
            {target && (
              <div className="ingestion-controls">
                <button 
                  onClick={handleStartIngestion}
                  disabled={status === 'ingesting'}
                  className="start-ingestion-button"
                >
                  Start Ingestion
                </button>
              </div>
            )}
          </div>
        )}
        
        <StatusDisplay 
          status={status} 
          error={error} 
          result={result} 
        />
      </main>
    </div>
  );
}

export default App;