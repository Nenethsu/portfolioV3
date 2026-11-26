/**
 * Creates the owner account, or resets its password if the username exists.
 *   npm run create-owner
 * Asks for the username and password here (the password isn't shown), so neither ends up in
 * shell history. Needs DATABASE_URL in server/.env.
 */
import { createInterface } from "node:readline";
import type { RowDataPacket } from "mysql2";
import { hashPassword } from "../src/auth.ts";
import { ensureSchema, pool } from "../src/db.ts";

const ask = (question: string, hidden = false) =>
  new Promise<string>((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      const write = (rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput;
      (rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput = (s: string) =>
        write.call(rl, s.startsWith(question) ? s : "*".repeat(s.length ? 1 : 0));
    }
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write("\n");
      resolve(answer);
    });
  });

await ensureSchema();
const username = (await ask("Owner username: ")).trim();
if (!/^[A-Za-z0-9_.-]{3,64}$/.test(username)) {
  console.error("Use 3 to 64 letters, numbers, dots, dashes or underscores.");
  process.exit(1);
}
const password = await ask("Password (12+ characters): ", true);
if (password.length < 12) {
  console.error("The password must be at least 12 characters.");
  process.exit(1);
}
if ((await ask("Password again: ", true)) !== password) {
  console.error("The passwords don't match.");
  process.exit(1);
}

const hash = await hashPassword(password);
const [rows] = await pool.query<RowDataPacket[]>("SELECT id FROM users WHERE username = ?", [username]);
if (rows[0]) {
  await pool.query("UPDATE users SET password_hash = ? WHERE id = ?", [hash, rows[0].id]);
  console.log(`Password reset for ${username}.`);
} else {
  await pool.query("INSERT INTO users (username, password_hash) VALUES (?, ?)", [username, hash]);
  console.log(`Owner ${username} created.`);
}
await pool.end();
