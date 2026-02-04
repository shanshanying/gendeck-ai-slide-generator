const { pool } = require('./db');

async function testConnection() {
  console.log('Testing database connection...\n');
  
  try {
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL');
    
    const result = await client.query('SELECT version()');
    console.log('📦 Server version:', result.rows[0].version.split(' ')[0]);
    
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('\n📋 Tables found:');
    if (tablesResult.rows.length === 0) {
      console.log('   (none - run schema.sql to create tables)');
    } else {
      tablesResult.rows.forEach(row => {
        console.log('   •', row.table_name);
      });
    }
    
    client.release();
    console.log('\n✅ Database test completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    console.log('\nTroubleshooting:');
    console.log('   1. Check if PostgreSQL is running: pg_isready');
    console.log('   2. Verify credentials in .env file');
    console.log('   3. Ensure database exists: createdb gendeck');
    console.log('   4. Check if port 5432 is correct');
    process.exit(1);
  }
}

testConnection();
