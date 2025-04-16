import React, { useState } from 'react';

function ClickHouseSourceForm({ onConnect }) {
  const [formData, setFormData] = useState({
    host: '',
    port: '8123',
    database: '',
    user: '',
    jwtToken: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onConnect(formData);
  };

  return (
    <div className="clickhouse-form">
      <h3>ClickHouse Connection</h3>
      <form onSubmit={handleSubmit}>
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
        
        <button type="submit" className="connect-button">Connect</button>
      </form>
    </div>
  );
}

export default ClickHouseSourceForm;