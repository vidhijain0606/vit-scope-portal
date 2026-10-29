import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: true },
});

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Keep the oldest row per (date, start_time); delete the rest.
    // Bookings reference slots by slot_id, so re-point any booking that
    // pointed at a duplicate (now-deleted) slot to the surviving row first.
    const { rows: dupes } = await client.query(`
      SELECT date, start_time, array_agg(id ORDER BY created_at ASC) AS ids
      FROM slots
      GROUP BY date, start_time
      HAVING COUNT(*) > 1
    `);

    for (const dupe of dupes) {
      const [keepId, ...dropIds] = dupe.ids;
      await client.query(
        `UPDATE bookings SET slot_id = $1 WHERE slot_id = ANY($2::uuid[])`,
        [keepId, dropIds]
      );
      await client.query(`DELETE FROM slots WHERE id = ANY($1::uuid[])`, [dropIds]);
      console.log(`Deduped ${dupe.date} ${dupe.start_time}: kept ${keepId}, removed ${dropIds.length}`);
    }

    try {
      await client.query(`
        ALTER TABLE slots
        ADD CONSTRAINT unique_slot_datetime UNIQUE (date, start_time)
      `);
    } catch (err) {
      if (err.code === '42710') {
        console.log('Constraint already exists.');
      } else {
        throw err;
      }
    }

    await client.query('COMMIT');
    console.log('Done.');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
