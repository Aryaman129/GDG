const { createClient } = require('@supabase/supabase-js');

// Hardcoded credentials from the .env file
const supabaseUrl = "https://xyfesgfkdzghvndhmnvj.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5ZmVzZ2ZrZHpnaHZuZGhtbnZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3ODM2MDIsImV4cCI6MjA2MTM1OTYwMn0.rf2ucQcPZHxRvVPlHVOI_TBIgxlKGda2J0MmVVo54m8";

async function testSupabase() {
  console.log('Testing Supabase connection with hardcoded credentials...');
  console.log('Supabase URL:', supabaseUrl);
  console.log('Supabase Key:', supabaseKey ? 'Key is set' : 'Key is missing');
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test a simple query
    console.log('Testing read operation...');
    const { data, error } = await supabase.from('profiles').select('*').limit(5);
    
    if (error) {
      console.error('Supabase query failed:', error.message);
    } else {
      console.log('Read operation successful!');
      console.log('Profiles:', data);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testSupabase();
