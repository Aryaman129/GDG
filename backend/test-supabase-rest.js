const fetch = require('node-fetch');

const SUPABASE_URL = 'https://xyfesgfkdzghvndhmnvj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5ZmVzZ2ZrZHpnaHZuZGhtbnZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3ODM2MDIsImV4cCI6MjA2MTM1OTYwMn0.rf2ucQcPZHxRvVPlHVOI_TBIgxlKGda2J0MmVVo54m8';

async function testSupabaseRest() {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    const data = await response.json();
    console.log('Supabase REST API response:', data);
    console.log('Status:', response.status);
    console.log('Connection successful!');
  } catch (error) {
    console.error('Error connecting to Supabase REST API:', error);
  }
}

testSupabaseRest();
