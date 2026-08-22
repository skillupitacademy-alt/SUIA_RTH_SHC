#!/usr/bin/env node
import 'dotenv/config';

const BASE_URL = 'https://admin.skillhubcore.in';
const ADMIN_EMAIL = 'admin@skillhubcore.in';
const ADMIN_PASSWORD = 'testing';

async function main() {
  try {
    // Login
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    });
    
    const setCookie = loginRes.headers.get('set-cookie');
    const token = setCookie?.match(/accessToken=([^;]+)/)?.[1];
    
    if (!token) {
      throw new Error('Login failed');
    }
    
    // Fetch hierarchy
    const hierarchyRes = await fetch(`${BASE_URL}/api/tutorial-left-sidebar/hierarchy`, {
      headers: { 'Cookie': `accessToken=${token}` }
    });
    
    const hierarchy = await hierarchyRes.json();
    
    console.log('Full Hierarchy Structure:');
    console.log(JSON.stringify(hierarchy, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
