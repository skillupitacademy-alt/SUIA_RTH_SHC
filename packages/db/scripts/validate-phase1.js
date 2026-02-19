
const { neon } = require('@neondatabase/serverless');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });
const sql = neon(process.env.DATABASE_URL);

async function validate() {
    const validations = [
        { name: 'Score Distribution', query: 'SELECT * FROM mv_score_distribution LIMIT 5;' },
        { name: 'Question Hierarchy', query: 'SELECT * FROM mv_question_hierarchy LIMIT 5;' },
        { name: 'Topic-Skill Matrix', query: 'SELECT * FROM mv_topic_skill_matrix LIMIT 5;' },
        { name: 'Item Difficulty', query: 'SELECT * FROM mv_item_difficulty ORDER BY accuracy_percent ASC LIMIT 5;' }
    ];

    for (const validation of validations) {
        const rows = await sql(validation.query);
        console.log(`\n📊 ${validation.name}:`);
        console.table(rows);
    }
}

validate();
