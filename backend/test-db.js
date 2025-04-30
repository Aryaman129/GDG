const { Client } = require('pg');
require('dotenv').config();

async function testConnection() {
  // Try the DATABASE_URL
  console.log('Testing DATABASE_URL connection...');
  try {
    const client1 = new Client({
      connectionString: process.env.DATABASE_URL
    });
    await client1.connect();
    console.log('DATABASE_URL connection successful!');
    const result1 = await client1.query('SELECT NOW()');
    console.log('Query result:', result1.rows[0]);
    await client1.end();
  } catch (error) {
    console.error('DATABASE_URL connection failed:', error.message);
  }

  // Try the DIRECT_URL
  console.log('\nTesting DIRECT_URL connection...');
  try {
    const client2 = new Client({
      connectionString: process.env.DIRECT_URL
    });
    await client2.connect();
    console.log('DIRECT_URL connection successful!');
    const result2 = await client2.query('SELECT NOW()');
    console.log('Query result:', result2.rows[0]);
    await client2.end();
  } catch (error) {
    console.error('DIRECT_URL connection failed:', error.message);
  }
}

testConnection();
