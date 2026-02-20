// Copy and paste this entire code into your browser console at https://robochamps-erp.vercel.app

fetch('https://robochamps-erp.vercel.app/api/admin/reset-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'web@robowunder.com',
    newPassword: 'Robochamps',
    secretKey: 'robochamps-admin-reset-2024'
  })
})
.then(res => res.json())
.then(data => {
  console.log('✅ Result:', data);
  if (data.success) {
    console.log('✅ Password reset successful!');
    console.log('Now try logging in with:');
    console.log('Email: web@robowunder.com');
    console.log('Password: Robochamps');
  } else {
    console.error('❌ Error:', data.error);
  }
})
.catch(err => {
  console.error('❌ Error:', err);
  console.log('Make sure you are on https://robochamps-erp.vercel.app');
});
