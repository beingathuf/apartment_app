// backend/db.js
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

let pool = null;

function makePoolConfig() {
  // If you set full DATABASE_URL, use it directly
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: Number(process.env.PG_MAX_CLIENTS) || 20,
      idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT) || 30000,
      connectionTimeoutMillis:
        Number(process.env.PG_CONNECTION_TIMEOUT) || 2000,
      // ADD THIS: Set timezone to UTC for all queries
      timezone: "UTC",
    };
  }

  // Otherwise build config from individual PG_* vars
  return {
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT ? Number(process.env.PG_PORT) : 5432,
    ssl:
      process.env.PG_SSL === "true" ? { rejectUnauthorized: false } : undefined,
    max: Number(process.env.PG_MAX_CLIENTS) || 20,
    idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT) || 30000,
    connectionTimeoutMillis: Number(process.env.PG_CONNECTION_TIMEOUT) || 20000,
    // ADD THIS: Set timezone to UTC for all queries
    timezone: "UTC",
  };
}

function initPool() {
  if (pool) return pool;
  const cfg = makePoolConfig();
  pool = new Pool(cfg);

  pool.on("error", (err) => {
    console.error("Unexpected error on idle pg client", err);
  });

  return pool;
}

async function query(text, params = []) {
  const p = initPool();
  const start = Date.now();
  try {
    const res = await p.query(text, params);
    // optional logging:
    // const duration = Date.now() - start;
    // console.log('executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (err) {
    err.query = text;
    throw err;
  }
}

async function getClient() {
  const p = initPool();
  const client = await p.connect();
  const release = client.release.bind(client);
  let released = false;
  client.release = (...args) => {
    if (!released) {
      released = true;
      return release(...args);
    }
    return;
  };
  return client;
}

async function runMigrations() {
  initPool();
  const sqlPath = path.join(__dirname, "migrations.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");
  // run as a single query - pg supports multiple statements separated by semicolons
  await query(sql);
}

async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = {
  initPool,
  query,
  getClient,
  runMigrations,
  closePool,
};
