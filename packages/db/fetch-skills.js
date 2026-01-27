const { db, skills } = require('./dist/index');

async function check() {
    try {
        const allSkills = await db.select().from(skills);
        console.log('SKILLS:', JSON.stringify(allSkills, null, 2));
    } catch (err) {
        console.error('ERROR:', err);
    }
}

check();
