import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));

const ADMIN_USERNAME = process.env.SEED_ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD;

if (!ADMIN_PASSWORD) {
  console.error('Set SEED_ADMIN_PASSWORD env var before running this script.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: true },
});

async function main() {
  const schema = readFileSync(join(__dirname, '../database/azure_postgres_setup.sql'), 'utf-8');
  await pool.query(schema);
  console.log('Schema applied.');

  const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await pool.query(
    `INSERT INTO admins (username, password_hash) VALUES ($1, $2)
     ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
    [ADMIN_USERNAME, hash]
  );
  console.log(`Admin account '${ADMIN_USERNAME}' seeded.`);

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
