import React, { useState } from 'react';

function FlatFileTargetForm({ onConfigChange }) {
  const [formData, setFormData] = useState({
    fileName: 'export.csv',
    delimiter: ','
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedFormData = {
      ...formData,
      [name]: value
    };
    
    setFormData(updatedFormData);
    onConfigChange(updatedFormData);
  };

  return (
    <div className="flatfile-form">
      <h3>Flat File Target Configuration</h3>
      <div className="form-group">
        <label>File Name:</label>
        <input
          type="text"
          name="fileName"
          value={formData.fileName}
          onChange={handleChange}
          placeholder="e.g., export.csv"
          required
        />
      </div>
      
      <div className="form-group">
        <label>Delimiter:</label>
        <select 
          name="delimiter"
          value={formData.delimiter} 
          onChange={handleChange}
        >
          <option value=",">Comma (,)</option>
          <option value=";">Semicolon (;)</option>
          <option value="\t">Tab</option>
          <option value="|">Pipe (|)</option>
        </select>
      </div>
    </div>
  );
}

export default FlatFileTargetForm;
