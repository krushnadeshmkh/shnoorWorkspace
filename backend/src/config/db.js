const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 500,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 20000,
  maxUses: 7500,
  allowExitOnIdle: false,
  statement_timeout: 10000,
  query_timeout: 10000,
  application_name: 'myapp',
});

pool.on('connect', () => {
  console.log('Connected to PostgreSQL');
});

pool.on('acquire', () => {
  console.log('Client acquired from pool');
});

pool.on('remove', () => {
  console.log('Client removed from pool');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

process.on('SIGINT', async () => {
  console.log('Closing database pool...');
  await pool.end();
  console.log('Database pool closed');
  process.exit(0);
});

module.exports = pool;