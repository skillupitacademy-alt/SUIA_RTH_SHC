#!/usr/bin/env node


const TEST_EMAIL_RTH = "ajayshah@gmail.com";
const TEST_PASSWORD_RTH = "testing";

const TEST_EMAIL_SKILLUP = "student@skillupitacademy.com";
const TEST_PASSWORD_SKILLUP = "testing";



const BRANDS = [
    {
        name: 'RTH',
        baseUrl: 'https://user.realtutorialhub.com',
        email: TEST_EMAIL_RTH,
        password: TEST_PASSWORD_RTH,
    },
    {
        name: 'SkillUp',
        baseUrl: 'https://user.skillupitacademy.com',
        email: TEST_EMAIL_SKILLUP,
        password: TEST_PASSWORD_SKILLUP,
    },
];

async function testBrand(brand) {
    console.log(`\n🔍 Testing ${brand.name}`);
    console.log('====================================');

    let cookies = '';

    try {
        // 1. LOGIN
        const loginRes = await fetch(`${brand.baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: brand.email,
                password: brand.password,
            }),
        });

        if (loginRes.status !== 200) {
            throw new Error(`Login failed (${loginRes.status})`);
        }

        const setCookie = loginRes.headers.get('set-cookie');
        cookies = setCookie || '';
        
        console.log('  Login: ✅');

        // 2. PROFILE (/me)
        const meRes = await fetch(`${brand.baseUrl}/api/auth/me`, {
            headers: { cookie: cookies },
        });

        if (meRes.status !== 200) {
            throw new Error(`/me failed (${meRes.status})`);
        }

        console.log('  Profile: ✅');

        // 3. ONBOARDING (may be 200 or 403 depending state)
        const onboardingRes = await fetch(`${brand.baseUrl}/api/onboarding`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                cookie: cookies,
            },
            body: JSON.stringify({ test: true }),
        });

        if (![200, 403].includes(onboardingRes.status)) {
            throw new Error(`Onboarding unexpected (${onboardingRes.status})`);
        }

        console.log('  Onboarding: ✅');

        // 4. SESSIONS
        const sessionRes = await fetch(`${brand.baseUrl}/api/auth/sessions`, {
            headers: { cookie: cookies },
        });

        if (sessionRes.status !== 200) {
            throw new Error(`Sessions failed (${sessionRes.status})`);
        }

        const sessionData = await sessionRes.json();

        const hasCurrent = sessionData?.sessions?.some(s => s.isCurrent);

        console.log('  Sessions: ✅');
        console.log(`  Current session marked: ${hasCurrent ? '✅' : '❌'}`);

        return {
            brand: brand.name,
            login: '✅',
            profile: '✅',
            onboarding: '✅',
            sessions: '✅',
            currentSession: hasCurrent ? '✅' : '❌',
        };

    } catch (err) {
        console.error(`❌ ${brand.name} FAILED:`, err.message);

        return {
            brand: brand.name,
            error: err.message,
        };
    }
}

(async () => {
    console.log('🚀 FINAL AUTH DIAGNOSTIC');
    console.log('====================================');

    const results = [];

    for (const brand of BRANDS) {
        const result = await testBrand(brand);
        results.push(result);
    }

    console.log('\n📊 SUMMARY');
    console.log('====================================');

    console.table(results);

    const allPassed = results.every(r =>
        r.login === '✅' &&
        r.profile === '✅' &&
        r.onboarding === '✅' &&
        r.sessions === '✅' &&
        r.currentSession === '✅'
    );

    console.log('\n🏁 FINAL RESULT');
    console.log('====================================');

    if (allPassed) {
        console.log('✅ PASS — SAFE TO DEPLOY');
        process.exit(0);
    } else {
        console.log('❌ FAIL — ROLLBACK REQUIRED');
        process.exit(1);
    }
})();