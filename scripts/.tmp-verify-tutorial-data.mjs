import { db } from '../packages/db-tutorial/src/index.ts';
import { sql } from 'drizzle-orm';

const stats = await db.execute(sql`
  SELECT 
    COUNT(*) as total_rows,
    COUNT(*) FILTER (WHERE status = 'draft') as draft_rows,
    COUNT(*) FILTER (WHERE status = 'published') as published_rows,
    COUNT(*) FILTER (WHERE deleted_at IS NULL) as active_rows,
    COUNT(DISTINCT navigation_node_id) as distinct_navigation_nodes,
    COUNT(*) FILTER (WHERE content IS NOT NULL) as rows_with_content,
    COUNT(*) FILTER (WHERE jsonb_array_length(content->'blocks') > 0) as rows_with_blocks
  FROM tutorial_sections
`);

console.log('TUTORIAL_SECTIONS DATA SUMMARY:');
console.log(JSON.stringify(stats.rows[0], null, 2));
