/** TiDB Cloud (MySQL-compatible) or a local MySQL: the connection pool and the users table. */
import mysql from "mysql2/promise";

const url = process.env.DATABASE_URL?.trim();
if (!url) throw new Error("Missing environment variable DATABASE_URL (see server/README.md).");

// TiDB Cloud only accepts TLS; its certificate is publicly trusted, so Node's CA list verifies it.
// DATABASE_SSL=false is only for a local MySQL without TLS.
const ssl = process.env.DATABASE_SSL === "false" ? undefined : { minVersion: "TLSv1.2", rejectUnauthorized: true };

export const pool = mysql.createPool({
  uri: url,
  ssl,
  connectionLimit: 5,
  waitForConnections: true,
  enableKeepAlive: true,
  charset: "utf8mb4",
});

/** Creates the users table if it's missing. Safe to run on every start. */
export const ensureSchema = async () => {
  await pool.query(`CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(64) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
};
