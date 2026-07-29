const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load .env.local if present
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const [key, ...vals] = line.split('=');
    if (key && vals.length > 0) {
      process.env[key.trim()] = vals.join('=').trim();
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://yxiniazontslpivaoxfb.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const targetEmail = 'kag07rohit@gmail.com';
  const targetPassword = 'xerowa2026';
  const targetBusinessId = process.env.DEFAULT_BUSINESS_ID || '6a427b8d-ec8e-418d-9eea-c8eae278e451';

  console.log(`Setting up Admin User for ${targetEmail}...`);

  // 1. Check if user already exists
  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('Failed to list users:', listError.message);
    process.exit(1);
  }

  let user = usersData.users.find((u) => u.email === targetEmail);

  if (user) {
    console.log(`User ${targetEmail} exists (${user.id}). Updating password and admin metadata...`);
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      password: targetPassword,
      email_confirm: true,
      user_metadata: { role: 'admin', full_name: 'Rohit Kag (Admin)' },
      app_metadata: { role: 'admin', platform_role: 'admin' },
    });
    if (updateError) {
      console.error('Failed to update user:', updateError.message);
      process.exit(1);
    }
    user = updateData.user;
  } else {
    console.log(`User ${targetEmail} does not exist. Creating new user...`);
    const { data: createData, error: createError } = await supabase.auth.admin.createUser({
      email: targetEmail,
      password: targetPassword,
      email_confirm: true,
      user_metadata: { role: 'admin', full_name: 'Rohit Kag (Admin)' },
      app_metadata: { role: 'admin', platform_role: 'admin' },
    });
    if (createError) {
      console.error('Failed to create user:', createError.message);
      process.exit(1);
    }
    user = createData.user;
  }

  console.log(`✅ Supabase Auth user configured: ID=${user.id}`);

  // 2. Ensure user is in business_members table with admin role
  if (targetBusinessId) {
    const { data: member, error: memberError } = await supabase
      .from('business_members')
      .upsert({
        business_id: targetBusinessId,
        user_id: user.id,
        role: 'admin',
      }, { onConflict: 'business_id,user_id' })
      .select('*');

    if (memberError) {
      console.warn('Note on business_members upsert:', memberError.message);
    } else {
      console.log('✅ Granted admin role in business_members table for default business!');
    }
  }

  console.log('\n🎉 SUCCESS! Admin user ready:');
  console.log(`Email: ${targetEmail}`);
  console.log(`Password: ${targetPassword}`);
  console.log(`Platform Role: admin`);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
