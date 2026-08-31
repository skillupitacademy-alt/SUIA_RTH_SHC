import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL_TUTORIAL);

const stats = await sql`
  SELECT 
    COUNT(*)::int as total_rows,
    COUNT(*) FILTER (WHERE status = 'draft')::int as draft_rows,
    COUNT(*) FILTER (WHERE status = 'deployed')::int as deployed_rows,
    COUNT(*) FILTER (WHERE deleted_at IS NULL)::int as active_rows,
    COUNT(DISTINCT navigation_node_id)::int as distinct_navigation_nodes,
    COUNT(*) FILTER (WHERE content IS NOT NULL)::int as rows_with_content,
    COUNT(*) FILTER (WHERE jsonb_array_length(content->'blocks') > 0)::int as rows_with_blocks
  FROM tutorial_sections
`;

console.log('✅ TUTORIAL_SECTIONS DATA SUMMARY:');
console.log(JSON.stringify(stats[0], null, 2));
