import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Try loading .env from current directory first
dotenv.config();

// If DATABASE_URL is not set, try loading from parent directory
if (!process.env.DATABASE_URL) {
  const parentEnv = path.resolve('..', '.env');
  if (fs.existsSync(parentEnv)) {
    dotenv.config({ path: parentEnv });
  }
}

let databaseURL = process.env.DATABASE_URL || 'postgresql://postgres:Avre1402@localhost:5432/jdi';

// Clean surrounding quotes
databaseURL = databaseURL.replace(/^["']|["']$/g, '');

// Map schema= to search_path= for node-postgres (pg) compatibility
databaseURL = databaseURL.replace(/schema=/g, 'search_path=');

// Ensure sslmode=disable is set if no sslmode parameter is specified
if (!databaseURL.includes('sslmode=')) {
  if (databaseURL.includes('?')) {
    databaseURL += '&sslmode=disable';
  } else {
    databaseURL += '?sslmode=disable';
  }
}

const config = {
  databaseURL,
  port: process.env.PORT || 3001,
  basicAuth: {
    user: process.env.BASIC_AUTH_USER || 'JDI-API',
    pass: process.env.BASIC_AUTH_PASS || 'JDI-GO2026',
  },
};

console.log(`[Config] Loaded config. DB URL length: ${config.databaseURL.length} chars. Target Port: ${config.port}. Basic Auth User: ${config.basicAuth.user}`);

export default config;
