import fs from 'fs';

const cookieJar = new Map();

async function login() {
  const response = await fetch('http://localhost:3009/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'student@skillupitacademy.com',
      password: 'testing',
      platform: 'skillup'
    })
  });

  const cookies = response.headers.getSetCookie?.() || [];
  cookies.forEach(cookie => {
    const [nameValue] = cookie.split(';');
    const [name, value] = nameValue.split('=');
    cookieJar.set(name.trim(), value);
  });
}

async function fetchPage() {
  const cookieHeader = Array.from(cookieJar.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');

  const response = await fetch(
    'http://localhost:3009/tutorial-v2/full-stack-development/backend-development/java/whatisjava/what-is-java',
    {
      headers: {
        Accept: 'text/html',
        Cookie: cookieHeader
      }
    }
  );

  return await response.text();
}

await login();
const html = await fetchPage();
fs.writeFileSync('test-results/phase11/tutorial-page.html', html);
console.log('Saved to test-results/phase11/tutorial-page.html');
console.log('Length:', html.length);
