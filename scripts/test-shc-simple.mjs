import 'dotenv/config';

const response = await fetch('https://api.skillhubcore.in/api/shc/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-internal-key': process.env.INTERNAL_API_KEY || '',
  },
  body: JSON.stringify({
    email: 'admin@skillhubcore.in',
    password: 'testing',
  }),
});

console.log('Status:', response.status);
const data = await response.json();
console.log('Response:', JSON.stringify(data, null, 2));

if (data.accessToken) {
  console.log('\n✅ Login successful!');
  console.log('User:', data.user.email);
  console.log('Role:', data.user.role);
} else {
  console.log('\n❌ Login failed');
}
