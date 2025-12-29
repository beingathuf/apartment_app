// backend/scripts/list-tables.js
const { init, getDb } = require('../db');

(async () => {
  try {
    await init('./pgdata');
    const db = getDb();

    // adapt to your schema names from migrations; common names from your debug endpoint:
    const tables = ['users','buildings','apartments','notices','payments','visitor_passes','bookings','complaints','events'];

    for (const t of tables) {
      try {
        const r = await db.query(`SELECT * FROM ${t} LIMIT 100;`);
        console.log('===', t, '=== rows:', r.rows.length);
        console.table(r.rows);
      } catch (err) {
        // ignore missing tables (some may not exist yet)
        // console.warn('Table', t, 'error:', err.message);
      }
    }

    process.exit(0);
  } catch (e) {
    console.error('Error listing tables:', e);
    process.exit(1);
  }
})();
