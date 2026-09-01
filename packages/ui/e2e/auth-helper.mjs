/**
 * Authentication Helper for E2E Tests
 * 
 * Provides login functionality for SkillUp and RealTutorialHub brands
 */

/**
 * Login and get accessToken cookie
 * @param {Object} options
 * @param {string} options.baseUrl - Base URL (e.g., http://skillup.localhost:3009)
 * @param {string} options.email - User email
 * @param {string} options.password - User password
 * @param {string} options.brand - Brand identifier (skillup or realtutorialhub)
 * @returns {Promise<{success: boolean, accessToken?: string, error?: string}>}
 */
export async function login({ baseUrl, email, password, brand }) {
  try {
    const loginUrl = `${baseUrl}/api/auth/login`;
    
    console.log(`  Attempting login: ${email} at ${loginUrl}`);
    
    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-brand': brand,
      },
      body: JSON.stringify({ email, password }),
      redirect: 'manual', // Don't follow redirects
    });

    console.log(`  Login response status: ${response.status}`);

    if (response.status === 200 || response.status === 302) {
      // Extract accessToken from Set-Cookie header
      const setCookie = response.headers.get('set-cookie');
      
      if (setCookie) {
        // Parse accessToken from Set-Cookie header
        const match = setCookie.match(/accessToken=([^;]+)/);
        if (match) {
          const accessToken = match[1];
          console.log(`  ✓ Authentication successful`);
          console.log(`  ✓ Access token obtained (length: ${accessToken.length})`);
          return { success: true, accessToken };
        }
      }

      // Check if response body contains token
      const body = await response.text();
      try {
        const json = JSON.parse(body);
        if (json.accessToken) {
          console.log(`  ✓ Authentication successful (token in body)`);
          return { success: true, accessToken: json.accessToken };
        }
      } catch {
        // Not JSON, ignore
      }

      console.log(`  ⚠️  Login succeeded but no token found`);
      return { success: false, error: 'No access token in response' };
    } else {
      const body = await response.text();
      console.log(`  ✗ Login failed: ${response.status}`);
      console.log(`  Response: ${body.substring(0, 200)}`);
      return { success: false, error: `Login failed with status ${response.status}` };
    }
  } catch (error) {
    console.log(`  ✗ Login error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Test credentials for different brands
 */
export const testCredentials = {
  skillup: {
    baseUrl: 'http://skillup.localhost:3009',
    email: 'student@skillupitacademy.com',
    password: 'testing',
    brand: 'skillup',
  },
  realtutorialhub: {
    baseUrl: 'http://realtutorialhub.localhost:3003',
    email: 'ajayshah@gmail.com',
    password: 'testing',
    brand: 'realtutorialhub',
  },
};

/**
 * Get internal API authentication headers
 * @param {string} userId - User ID
 * @param {string} brand - Brand identifier
 * @returns {Object} Headers object
 */
export function getInternalApiHeaders(userId, brand) {
  const internalSecret = process.env.INTERNAL_API_SECRET;
  
  if (!internalSecret) {
    throw new Error('INTERNAL_API_SECRET not configured');
  }

  return {
    'X-Internal-Secret': internalSecret,
    'X-User-ID': userId,
    'X-Brand': brand,
    'Content-Type': 'application/json',
  };
}
