require("dotenv").config();
const { Client } = require('pg');
const examId = process.argv[2] || '0a38074c-2113-4527-bc15-1cbfc1836cea';
const sql = 'select exam_id, question_count, score, mastery, mh_accuracy, avg_time, median_time, total_time, stable_time_sec, logic_time_sec, neural_time_sec, fast_wrong, slow_wrong, slow_correct, fast_correct, stable_count, logic_count, error_count from attempt_analytics_mv where exam_id=$1';
(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  const res = await client.query(sql, [examId]);
  console.log(res.rows);
  await client.end();
})();
