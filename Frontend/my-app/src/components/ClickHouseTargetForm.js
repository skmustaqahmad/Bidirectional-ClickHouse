import React, { useState } from 'react';

function ClickHouseTargetForm({ onConfigChange }) {
  const [formData, setFormData] = useState({
    host: '',
    port: '8123',
    database: '',
    user: '',
    jwtToken: '',
    targetTable: ''
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
    <div className="clickhouse-form">
      <h3>ClickHouse Target Connection</h3>
      <div className="form-group">
        <label>Host:</label>
        <input
          type="text"
          name="host"
          value={formData.host}
          onChange={handleChange}
          placeholder="e.g., localhost or clickhouse.example.com"
          required
        />
      </div>
      
      <div className="form-group">
        <label>Port:</label>
        <input
          type="text"
          name="port"
          value={formData.port}
          onChange={handleChange}
          placeholder="e.g., 8123 (HTTP) or 8443 (HTTPS)"
          required
        />
      </div>
      
      <div className="form-group">
        <label>Database:</label>
        <input
          type="text"
          name="database"
          value={formData.database}
          onChange={handleChange}
          placeholder="e.g., default"
          required
        />
      </div>
      
      <div className="form-group">
        <label>User:</label>
        <input
          type="text"
          name="user"
          value={formData.user}
          onChange={handleChange}
          placeholder="e.g., default"
          required
        />
      </div>
      
      <div className="form-group">
        <label>JWT Token:</label>
        <textarea
          name="jwtToken"
          value={formData.jwtToken}
          onChange={handleChange}
          placeholder="Paste your JWT token here"
          required
        />
      </div>

      <div className="form-group">
        <label>Target Table Name:</label>
        <input
          type="text"
          name="targetTable"
          value={formData.targetTable}
          onChange={handleChange}
          placeholder="Enter target table name"
          required
        />
      </div>
    </div>
  );
}

export default ClickHouseTargetForm;