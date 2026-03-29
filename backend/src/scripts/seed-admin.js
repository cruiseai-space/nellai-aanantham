const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const supabase = createClient(
  process.env.SUPABASE_API_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function seedAdmin() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'admin@nellai.com',
    password: 'Admin@123',
    email_confirm: true,
    user_metadata: { full_name: 'Admin User', role: 'admin' }
  });

  if (error) {
    if (error.message.includes('already been registered')) {
      console.log('Admin user already exists');
      return;
    }
    console.error('Error creating admin:', error.message);
    return;
  }

  console.log('Admin user created:', data.user.email);
}

seedAdmin();
