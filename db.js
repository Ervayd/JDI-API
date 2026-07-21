import pkg from 'pg';
import config from './config.js';

const { Pool } = pkg;

const pool = new Pool({
  connectionString: config.databaseURL,
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected error on idle client', err);
});

export async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    // Optional: log query stats
    return res;
  } catch (error) {
    console.error(`[DB] Query Error: ${error.message} (Query: ${text.slice(0, 100)})`);
    throw error;
  }
}

export async function checkConnection() {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
    return true;
  } catch (err) {
    console.error('[DB] Connection check failed:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

export default pool;
