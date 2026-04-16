const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

async function testSharedUIServices() {
  console.log('🔍 Testing shared UI/UX services...');
  
  const services = [
    {
      name: 'RTH Web Service (Direct)',
      url: process.env.TUTORIAL_SERVICE_URL,
      description: 'Direct access to realtutorialhub-web Cloud Run service'
    },
    {
      name: 'SkillUp Web Service (Direct)', 
      url: process.env.SKILLUP_WEB_URL,
      description: 'Direct access to skillup-web Cloud Run service'
    },
    {
      name: 'RTH User Domain (Through Gateway)',
      url: 'https://user.realtutorialhub.com',
      description: 'RTH shared UI through API Gateway'
    },
    {
      name: 'SkillUp User Domain (Through Gateway)',
      url: 'https://user.skillupitacademy.com', 
      description: 'SkillUp shared UI through API Gateway'
    }
  ];
  
  for (const service of services) {
    console.log(`\n🧪 Testing: ${service.name}`);
    console.log(`   URL: ${service.url}`);
    console.log(`   Purpose: ${service.description}`);
    
    try {
      const response = await fetch(service.url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const html = await response.text();
        
        // Check if it's the shared branding system
        const isSharedBranding = html.includes('share-branding') || 
                                html.includes('SharedLandingPage') ||
                                html.includes('RealTutorialHub') ||
                                html.includes('SkillUp IT Academy');
        
        const hasAuth = html.includes('/login') || html.includes('/signup');
        const hasAPI = html.includes('api/auth') || html.includes('NEXT_PUBLIC_API_URL');
        
        console.log(`   ✅ SUCCESS - Service responding`);
        console.log(`   🎨 Shared Branding: ${isSharedBranding ? '✅ YES' : '❌ NO'}`);
        console.log(`   🔐 Auth Pages: ${hasAuth ? '✅ YES' : '❌ NO'}`);
        console.log(`   🔌 API Integration: ${hasAPI ? '✅ YES' : '❌ NO'}`);
        
        // Check for specific brand indicators
        if (html.includes('RealTutorialHub')) {
          console.log(`   🏷️ Brand: RTH (RealTutorialHub)`);
        } else if (html.includes('SkillUp IT Academy')) {
          console.log(`   🏷️ Brand: SkillUp IT Academy`);
        }
        
        // Check title
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch) {
          console.log(`   📄 Title: ${titleMatch[1]}`);
        }
        
      } else {
        const errorText = await response.text();
        console.log(`   ❌ FAILED: ${errorText.substring(0, 200)}${errorText.length > 200 ? '...' : ''}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Network error: ${error.message}`);
    }
  }
  
  // Test specific shared branding pages
  console.log('\n🎨 Testing specific shared branding pages...');
  
  const sharedPages = [
    'https://user.realtutorialhub.com/login',
    'https://user.realtutorialhub.com/signup', 
    'https://user.skillupitacademy.com/login',
    'https://user.skillupitacademy.com/signup'
  ];
  
  for (const pageUrl of sharedPages) {
    try {
      const response = await fetch(pageUrl, { method: 'HEAD' });
      console.log(`   ${pageUrl}: ${response.status} ${response.statusText} ${response.ok ? '✅' : '❌'}`);
    } catch (error) {
      console.log(`   ${pageUrl}: ❌ ${error.message}`);
    }
  }
}

testSharedUIServices();