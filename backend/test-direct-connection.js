const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Direct connection string with SSL verification disabled
const connectionString = "postgresql://postgres:htkfSJrmhHnVggNp@db.xyfesgfkdzghvndhmnvj.supabase.co:5432/postgres?sslmode=no-verify";

async function testConnection() {
  const client = new Client({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false // Disable SSL verification for testing
    }
  });

  try {
    console.log('Connecting to Supabase database...');
    await client.connect();
    console.log('Connection successful!');

    // Test a simple query
    const result = await client.query('SELECT NOW() as current_time');
    console.log('Current database time:', result.rows[0].current_time);

    return true;
  } catch (error) {
    console.error('Error connecting to database:', error);
    return false;
  } finally {
    await client.end();
    console.log('Connection closed');
  }
}

testConnection()
  .then(success => {
    console.log('Test completed with success =', success);
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
  });
