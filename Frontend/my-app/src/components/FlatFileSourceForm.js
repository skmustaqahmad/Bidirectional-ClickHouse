import React, { useState } from 'react';

function FlatFileSourceForm({ onFileSelect }) {
  const [file, setFile] = useState(null);
  const [delimiter, setDelimiter] = useState(',');
  const [fileName, setFileName] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setFileName(selectedFile ? selectedFile.name : '');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (file) {
      onFileSelect({ file, delimiter, fileName });
    }
  };

  return (
    <div className="flatfile-form">
      <h3>Flat File Source</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Select File:</label>
          <input 
            type="file" 
            onChange={handleFileChange}
            accept=".csv,.txt,.tsv"
            required
          />
        </div>
        
        <div className="form-group">
          <label>Delimiter:</label>
          <select 
            value={delimiter} 
            onChange={(e) => setDelimiter(e.target.value)}
          >
            <option value=",">Comma (,)</option>
            <option value=";">Semicolon (;)</option>
            <option value="\t">Tab</option>
            <option value="|">Pipe (|)</option>
          </select>
        </div>
        
        <button type="submit" className="load-file-button" disabled={!file}>
          Load File
        </button>
      </form>
    </div>
  );
}

export default FlatFileSourceForm;