const { createClient } = require('@supabase/supabase-js');

// Supabase credentials from .env.local
const supabaseUrl = 'https://jibirpbauzqhdiwjlrmf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppYmlycGJhdXpxaGRpd2pscm1mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjU5NjkxMywiZXhwIjoyMDU4MTcyOTEzfQ.fcSI0_12Yczr2rg64r2Kgcv42CaOiTdxcpvHQQfgMvc';

async function createUser(email = 'example@example.com', password = 'TempPassword123!', name = 'Example User') {
  // Create Supabase client with service role key for admin operations
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    console.log(`Creating user ${email}...`);
    
    // Create user using admin API
    const { data, error } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Skip email confirmation
      user_metadata: {
        name: name
      }
    });

    if (error) {
      console.error('Error creating user:', error);
      return null;
    }

    console.log('✅ User created successfully!');
    console.log('User ID:', data.user.id);
    console.log('Email:', data.user.email);
    console.log('Created at:', data.user.created_at);
    console.log('Email confirmed:', data.user.email_confirmed_at ? 'Yes' : 'No');
    
    return data.user;
    
  } catch (err) {
    console.error('Unexpected error:', err);
    return null;
  }
}

// If running directly (not imported), create the example user
if (require.main === module) {
  // You can customize these values or pass them as command line arguments
  const email = process.argv[2] || 'example@example.com';
  const password = process.argv[3] || 'TempPassword123!';
  const name = process.argv[4] || 'Example User';
  
  createUser(email, password, name);
}

module.exports = { createUser }; 