const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Read .env file manually
function parseEnvFile(filePath) {
  const envConfig = {};
  const envContent = fs.readFileSync(filePath, 'utf8');

  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)="([^"]+)"$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      envConfig[key] = value;
    }
  });

  return envConfig;
}

async function testSupabaseConnection() {
  console.log('Testing Supabase connection...');

  try {
    // Get the absolute path to the .env file
    const envPath = path.resolve(__dirname, '.env');
    console.log('Looking for .env file at:', envPath);

    // Parse the .env file
    const envConfig = parseEnvFile(envPath);

    const supabaseUrl = envConfig.SUPABASE_URL;
    const supabaseKey = envConfig.SUPABASE_ANON_KEY;

    console.log('Supabase URL:', supabaseUrl);
    console.log('Supabase Key:', supabaseKey ? 'Key is set' : 'Key is missing');

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

    // Test insert operation with a test user
    console.log('\nTesting insert operation...');
    // Generate a proper UUID
    function generateUUID() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }

    const testUser = {
      id: generateUUID(),
      email: `test-${Date.now()}@example.com`,
      full_name: 'Test User',
      role: 'USER',
      otp_verified: true
    };

    const { data: insertData, error: insertError } = await supabase
      .from('profiles')
      .insert([testUser])
      .select();

    if (insertError) {
      console.error('Insert operation failed:', insertError.message);
    } else {
      console.log('Insert operation successful!');
      console.log('Inserted user:', insertData);

      // Test update operation
      console.log('\nTesting update operation...');
      const { data: updateData, error: updateError } = await supabase
        .from('profiles')
        .update({ full_name: 'Updated Test User' })
        .eq('id', testUser.id)
        .select();

      if (updateError) {
        console.error('Update operation failed:', updateError.message);
      } else {
        console.log('Update operation successful!');
        console.log('Updated user:', updateData);
      }

      // Test delete operation
      console.log('\nTesting delete operation...');
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', testUser.id);

      if (deleteError) {
        console.error('Delete operation failed:', deleteError.message);
      } else {
        console.log('Delete operation successful!');
      }
    }

  } catch (error) {
    console.error('Supabase connection failed:', error.message);
  }
}

testSupabaseConnection();
