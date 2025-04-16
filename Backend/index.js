// backend/index.js
const express = require('express');
const cors = require('cors');
const { ClickHouse } = require('@clickhouse/client');
const fs = require('fs');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Helper to create ClickHouse client
function createClickHouseClient(config) {
  return new ClickHouse({
    host: config.host,
    port: config.port,
    database: config.database,
    username: config.user,
    token: config.jwtToken,
    protocol: config.port === '8443' || config.port === '9440' ? 'https:' : 'http:'
  });
}

// Connect to ClickHouse and get tables
app.post('/api/clickhouse/tables', async (req, res) => {
  try {
    const { host, port, database, user, jwtToken } = req.body;
    
    const client = createClickHouseClient({ host, port, database, user, jwtToken });
    
    const query = `SELECT name FROM system.tables WHERE database = '${database}'`;
    const resultSet = await client.query({
      query,
      format: 'JSONEachRow'
    });
    
    const tables = await resultSet.json();
    
    res.json({ success: true, tables });
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get table columns
app.post('/api/clickhouse/columns', async (req, res) => {
  try {
    const { host, port, database, user, jwtToken, tableName } = req.body;
    
    const client = createClickHouseClient({ host, port, database, user, jwtToken });
    
    const query = `SELECT name, type FROM system.columns WHERE database = '${database}' AND table = '${tableName}'`;
    const resultSet = await client.query({
      query,
      format: 'JSONEachRow'
    });
    
    const columns = await resultSet.json();
    
    res.json({ success: true, columns });
  } catch (error) {
    console.error('Error fetching columns:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Preview data
app.post('/api/clickhouse/preview', async (req, res) => {
  try {
    const { host, port, database, user, jwtToken, tableName, selectedColumns } = req.body;
    
    const client = createClickHouseClient({ host, port, database, user, jwtToken });
    
    const columnsString = selectedColumns.join(', ');
    const query = `SELECT ${columnsString} FROM ${tableName} LIMIT 100`;
    
    const resultSet = await client.query({
      query,
      format: 'JSONEachRow'
    });
    
    const data = await resultSet.json();
    
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error previewing data:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ClickHouse to Flat File ingestion
app.post('/api/ingest/clickhouse-to-file', async (req, res) => {
  try {
    const { host, port, database, user, jwtToken, tableName, selectedColumns, fileName, delimiter } = req.body;
    
    const client = createClickHouseClient({ host, port, database, user, jwtToken });
    
    const columnsString = selectedColumns.join(', ');
    const query = `SELECT ${columnsString} FROM ${tableName}`;
    
    const resultSet = await client.query({
      query,
      format: 'JSONEachRow'
    });
    
    const data = await resultSet.json();
    
    // Create CSV Writer
    const csvWriter = createCsvWriter({
      path: `uploads/${fileName}`,
      header: selectedColumns.map(column => ({ id: column, title: column })),
      fieldDelimiter: delimiter || ','
    });
    
    await csvWriter.writeRecords(data);
    
    res.json({ success: true, recordCount: data.length, filePath: `uploads/${fileName}` });
  } catch (error) {
    console.error('Error during ClickHouse to file ingestion:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get Flat File Schema
app.post('/api/file/schema', upload.single('file'), (req, res) => {
  try {
    const filePath = req.file.path;
    const delimiter = req.body.delimiter || ',';
    
    let columns = [];
    let sampleData = [];
    let rowCount = 0;
    
    fs.createReadStream(filePath)
      .pipe(csv({ separator: delimiter }))
      .on('headers', (headers) => {
        columns = headers;
      })
      .on('data', (row) => {
        if (rowCount < 5) {
          sampleData.push(row);
        }
        rowCount++;
      })
      .on('end', () => {
        res.json({ 
          success: true, 
          columns, 
          sampleData,
          filePath,
          totalRows: rowCount
        });
      })
      .on('error', (error) => {
        console.error('Error reading file:', error);
        res.status(500).json({ success: false, message: error.message });
      });
  } catch (error) {
    console.error('Error getting file schema:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Flat File to ClickHouse ingestion
app.post('/api/ingest/file-to-clickhouse', async (req, res) => {
  try {
    const { host, port, database, user, jwtToken, filePath, selectedColumns, targetTable, delimiter } = req.body;
    
    const client = createClickHouseClient({ host, port, database, user, jwtToken });
    
    // Create table if it doesn't exist
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS ${targetTable} (
        ${selectedColumns.map(col => `${col} String`).join(', ')}
      ) ENGINE = MergeTree() ORDER BY tuple()
    `;
    
    await client.query({
      query: createTableQuery
    }).exec();
    
    // Prepare data from CSV
    const records = [];
    
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv({ separator: delimiter || ',' }))
        .on('data', (row) => {
          // Only keep selected columns
          const filteredRow = {};
          selectedColumns.forEach(col => {
            filteredRow[col] = row[col];
          });
          records.push(filteredRow);
        })
        .on('end', resolve)
        .on('error', reject);
    });
    
    // Insert data in batches
    const batchSize = 1000;
    let insertedCount = 0;
    
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      
      const values = batch.map(row => 
        `(${selectedColumns.map(col => `'${row[col]?.replace(/'/g, "\\'") || ''}'`).join(', ')})`
      ).join(', ');
      
      const insertQuery = `
        INSERT INTO ${targetTable} (${selectedColumns.join(', ')})
        VALUES ${values}
      `;
      
      await client.query({
        query: insertQuery
      }).exec();
      
      insertedCount += batch.length;
    }
    
    res.json({ success: true, recordCount: insertedCount });
  } catch (error) {
    console.error('Error during file to ClickHouse ingestion:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Multi-table join (bonus feature)
app.post('/api/clickhouse/join-preview', async (req, res) => {
  try {
    const { host, port, database, user, jwtToken, tables, joinConditions, selectedColumns } = req.body;
    
    const client = createClickHouseClient({ host, port, database, user, jwtToken });
    
    // Construct join query
    const mainTable = tables[0];
    let query = `SELECT ${selectedColumns.join(', ')} FROM ${mainTable}`;
    
    for (let i = 1; i < tables.length; i++) {
      query += ` JOIN ${tables[i]} ON ${joinConditions[i-1]}`;
    }
    
    query += ' LIMIT 100';
    
    const resultSet = await client.query({
      query,
      format: 'JSONEachRow'
    });
    
    const data = await resultSet.json();
    
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error previewing joined data:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Execute multi-table join and save to file
app.post('/api/ingest/join-to-file', async (req, res) => {
  try {
    const { host, port, database, user, jwtToken, tables, joinConditions, selectedColumns, fileName, delimiter } = req.body;
    
    const client = createClickHouseClient({ host, port, database, user, jwtToken });
    
    // Construct join query
    const mainTable = tables[0];
    let query = `SELECT ${selectedColumns.join(', ')} FROM ${mainTable}`;
    
    for (let i = 1; i < tables.length; i++) {
      query += ` JOIN ${tables[i]} ON ${joinConditions[i-1]}`;
    }
    
    const resultSet = await client.query({
      query,
      format: 'JSONEachRow'
    });
    
    const data = await resultSet.json();
    
    // Create CSV Writer
    const csvWriter = createCsvWriter({
      path: `uploads/${fileName}`,
      header: selectedColumns.map(column => ({ id: column, title: column })),
      fieldDelimiter: delimiter || ','
    });
    
    await csvWriter.writeRecords(data);
    
    res.json({ success: true, recordCount: data.length, filePath: `uploads/${fileName}` });
  } catch (error) {
    console.error('Error during join to file ingestion:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});