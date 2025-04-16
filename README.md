# ClickHouse & Flat File Data Ingestion Tool

A web-based application that facilitates bidirectional data ingestion between ClickHouse databases and flat files (CSV, TSV, etc.). This tool provides a user-friendly interface for connecting to data sources, selecting columns, and executing data transfers.

## Features

- Bidirectional data flow: ClickHouse → Flat File and Flat File → ClickHouse
- ClickHouse authentication using JWT tokens
- Schema discovery and column selection
- Data preview functionality
- Multi-table JOIN support (for ClickHouse source)
- Status and error reporting
- Record count reporting

## Project Structure

```
.
├── backend/             # Node.js backend with Express
│   ├── index.js         # Main server file
│   ├── package.json     # Backend dependencies
│   └── uploads/         # Directory for uploaded and generated files
└── frontend/            # React frontend
    ├── public/          # Public assets
    └── src/             # React components and styles
        ├── App.js       # Main application component
        ├── App.css      # Main styles
        └── components/  # Reusable UI components
```

## Prerequisites

- Node.js (v14+)
- npm or yarn
- Access to a ClickHouse database (local or remote)

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create an uploads directory if it doesn't exist:
   ```
   mkdir -p uploads
   ```

4. Start the backend server:
   ```
   npm start
   ```
   
   The server will run on http://localhost:5000 by default.

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```
   
   The React application will run on http://localhost:3000 by default.

## Usage Guide

1. **Select Data Source**: Choose between ClickHouse or Flat File as your data source.

2. **Configure Source**:
   - For ClickHouse: Enter connection details (host, port, database, user, JWT token)
   - For Flat File: Upload a file and specify delimiter

3. **Select Tables/Columns**:
   - For ClickHouse: Choose a table from the dropdown and then select columns
   - For Flat File: The schema will be automatically detected, then select columns

4. **Preview Data**: Click the "Preview Data" button to see a sample of the data

5. **Configure Target**:
   - For ClickHouse: Enter connection details and target table name
   - For Flat File: Specify file name and delimiter

6. **Start Ingestion**: Click the "Start Ingestion" button to begin the data transfer

7. **View Results**: After completion, the tool will display the total number of records processed

## Multi-Table Join Feature

To use the multi-table join feature:

1. Connect to ClickHouse and select the main table
2. Click "Enable Multi-Table Join"
3. Select additional tables to join
4. Specify join conditions for each table
5. Select columns from the joined tables
6. Continue with the normal workflow for previewing and ingesting data

## Test Datasets

For testing, you can use ClickHouse example datasets:

- [UK Price Paid Dataset](https://clickhouse.com/docs/getting-started/example-datasets/uk-price-paid)
- [On-Time Flight Performance Dataset](https://clickhouse.com/docs/getting-started/example-datasets/ontime)

## Troubleshooting

- **Connection Issues**: Verify your ClickHouse connection details and JWT token
- **Column Selection**: Ensure you've selected at least one column before proceeding
- **File Format**: For Flat File ingestion, make sure the file is properly formatted with consistent delimiters

## License

This project is licensed under the MIT License.
