import bcrypt from 'bcrypt';

async function generateHash() {
  const password = 'Sanjay99@';
  const hash = await bcrypt.hash(password, 10);
  
  console.log('\n=== Password Hash Generator ===\n');
  console.log('Password:', password);
  console.log('\nBcrypt Hash:');
  console.log(hash);
  console.log('\n=== SQL Query to Update Neon Database ===\n');
  console.log(`UPDATE admin_users SET username = 'sanjay', password = '${hash}' WHERE username = 'admin';`);
  console.log('\n=== Or Delete and Insert ===\n');
  console.log(`DELETE FROM admin_users WHERE username = 'admin';`);
  console.log(`INSERT INTO admin_users (username, password, email, full_name, role) VALUES ('sanjay', '${hash}', 'sanjay@schat.com', 'Sanjay', 'super_admin');`);
  console.log('\n');
}

generateHash();
