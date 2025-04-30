require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function testSupabaseConnection() {
  console.log('Testing Supabase connection...');
  
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    console.log('Supabase URL:', supabaseUrl);
    console.log('Supabase Key:', supabaseKey ? 'Key is set' : 'Key is missing');
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test a simple query
    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    
    if (error) {
      console.error('Supabase query failed:', error.message);
    } else {
      console.log('Supabase connection successful!');
      console.log('Query result:', data);
    }
  } catch (error) {
    console.error('Supabase connection failed:', error.message);
  }
}

testSupabaseConnection();
