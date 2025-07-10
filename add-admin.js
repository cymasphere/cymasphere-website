const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jibirpbauzqhdiwjlrmf.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppYmlycGJhdXpxaGRpd2pscm1mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjU5NjkxMywiZXhwIjoyMDU4MTcyOTEzfQ.fcSI0_12Yczr2rg64r2Kgcv42CaOiTdxcpvHQQfgMvc';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function addAdmin() {
  try {
    // First check if admin already exists
    const { data: existing, error: checkError } = await supabase
      .from('admins')
      .select('*')
      .eq('user', '900f11b8-c901-49fd-bfab-5fafe984ce72');
    
    if (checkError) {
      console.error('Error checking existing admin:', checkError);
      return;
    }
    
    if (existing && existing.length > 0) {
      console.log('User is already an admin:', existing[0]);
      return;
    }
    
    // Add user as admin
    const { data, error } = await supabase
      .from('admins')
      .insert([
        { user: '900f11b8-c901-49fd-bfab-5fafe984ce72' }
      ]);
    
    if (error) {
      console.error('Error adding admin:', error);
    } else {
      console.log('Successfully added admin:', data);
    }
  } catch (err) {
    console.error('Script error:', err);
  }
}

addAdmin(); 