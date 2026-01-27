const { db, domains } = require('@quiz/db');

async function check() {
    try {
        const allDomains = await db.select().from(domains);
        console.log('DOMAINS COUNT:', allDomains.length);
        console.log('DOMAINS:', JSON.stringify(allDomains, null, 2));
    } catch (err) {
        console.error('ERROR:', err);
    }
}

check();
