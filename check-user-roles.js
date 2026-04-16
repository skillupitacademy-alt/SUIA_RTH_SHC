const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkUserRoles() {
  const client = new Client({
    connectionString: process.env.DATABASE_DIRECT_URL_RTH,
  });

  try {
    await client.connect();
    console.log('Connected to RTH database');

    // Check user_roles table structure
    const columnsQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'user_roles' 
      ORDER BY ordinal_position
    `;
    
    const columns = await client.query(columnsQuery);
    console.log('📋 user_roles table structure:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // Check roles table structure
    const rolesColumnsQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'roles' 
      ORDER BY ordinal_position
    `;
    
    const rolesColumns = await client.query(rolesColumnsQuery);
    console.log('\n📋 roles table structure:');
    rolesColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // Check available roles
    const rolesQuery = 'SELECT id, name FROM roles';
    const roles = await client.query(rolesQuery);
    console.log('\n📋 Available roles:');
    roles.rows.forEach(role => {
      console.log(`  - ${role.name} (ID: ${role.id})`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkUserRoles();