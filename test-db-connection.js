// Simple database connection test without external dependencies
const https = require('https');
const { URL } = require('url');

async function testDatabaseConnection(dbUrl, brand) {
  console.log(`\n=== Testing ${brand} Database Connection ===`);
  
  // Parse the database URL to extract connection details
  const url = new URL(dbUrl);
  console.log(`Host: ${url.hostname}`);
  console.log(`Database: ${url.pathname.slice(1)}`);
  console.log(`User: ${url.username}`);
  
  // For now, just verify the URL format is correct
  if (url.protocol === 'postgresql:' && url.hostname && url.pathname) {
    console.log('✅ Database URL format is valid');
  } else {
    console.log('❌ Invalid database URL format');
  }
}

async function testAPIEndpoint(url, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'User-Agent': 'AuthDebug/1.0'
      }
    };
    
    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: responseData
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(data);
    req.end();
  });
}

async function main() {
  // Test database URLs
  const rthDb = 'postgresql://neondb_owner:npg_y5iSrBlo4FMn@ep-round-cherry-a1ogr3gr-pooler.ap-southeast-1.aws.neon.tech/rth_prod?sslmode=require&channel_binding=require';
  const skillupDb = 'postgresql://neondb_owner:npg_y5iSrBlo4FMn@ep-round-cherry-a1ogr3gr-pooler.ap-southeast-1.aws.neon.tech/skillup_prod?sslmode=require&channel_binding=require';
  
  await testDatabaseConnection(rthDb, 'RTH');
  await testDatabaseConnection(skillupDb, 'SkillUp');
  
  // Test API endpoints with detailed logging
  console.log('\n=== Testing RTH API Endpoint ===');
  try {
    const rthResponse = await testAPIEndpoint(
      'https://user.realtutorialhub.com/api/auth/login',
      {
        email: 'ajayshah@gmail.com',
        password: 'testing',
        platform: 'realtutorialhub'
      }
    );
    
    console.log(`Status: ${rthResponse.status}`);
    console.log('Response:', rthResponse.body);
    
    // Check if it's a CORS or routing issue
    if (rthResponse.status === 404) {
      console.log('❌ Endpoint not found - possible routing issue');
    } else if (rthResponse.status === 401) {
      console.log('❌ Authentication failed - credentials or database issue');
    } else if (rthResponse.status === 500) {
      console.log('❌ Server error - possible database connection issue');
    }
    
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
  
  console.log('\n=== Testing SkillUp API Endpoint ===');
  try {
    const skillupResponse = await testAPIEndpoint(
      'https://user.skillupitacademy.com/api/auth/login',
      {
        email: 'student@skillupitacademy.com',
        password: 'testing',
        platform: 'skillup'
      }
    );
    
    console.log(`Status: ${skillupResponse.status}`);
    console.log('Response:', skillupResponse.body);
    
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

main().catch(console.error);