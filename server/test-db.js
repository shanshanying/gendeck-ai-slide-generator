require('dotenv').config();
const { pool } = require('./db');

async function testConnection() {
  console.log('Testing database connection...\n');
  
  // Show configuration (without password)
  console.log('Configuration:');
  if (process.env.DATABASE_URL) {
    // Mask password in connection string
    const maskedUrl = process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':****@');
    console.log('   Mode: Connection URL');
    console.log('   URL:', maskedUrl);
  } else {
    console.log('   Mode: Individual parameters');
    console.log('   Host:', process.env.DB_HOST || 'localhost');
    console.log('   Port:', process.env.DB_PORT || '5432');
    console.log('   Database:', process.env.DB_NAME || 'gendeck');
    console.log('   User:', process.env.DB_USER || 'postgres');
    console.log('   Password:', process.env.DB_PASSWORD ? '**** (set)' : '(not set)');
  }
  console.log();
  
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
    console.error('\n❌ Connection failed:', err.message);
    console.log('\nTroubleshooting:');
    console.log('   1. Check if PostgreSQL is running');
    console.log('   2. Verify host/port in .env file');
    console.log('   3. Check username/password');
    console.log('   4. Ensure database exists');
    console.log('   5. For cloud DBs, check if SSL is required');
    console.log('\nCommon fixes:');
    console.log('   • Local: DB_HOST=localhost, DB_USER=postgres');
    console.log('   • Supabase: Use DATABASE_URL with sslmode=require');
    console.log('   • Railway: DATABASE_URL is auto-provided');
    console.log('   • Docker: DB_HOST=localhost, DB_USER/DB_PASSWORD from docker run');
    process.exit(1);
  }
}

testConnection();
