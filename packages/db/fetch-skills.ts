import { db } from './src/index';
import { skills } from './src/schema/domain';

async function main() {
    try {
        const allSkills = await db.select().from(skills);
        console.log(JSON.stringify(allSkills, null, 2));
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

main();
