/**
 * Owner login. Passwords are hashed with scrypt (Node's crypto, no package). A login returns a
 * signed token (HMAC-SHA256, 7 days) that the site sends back as `Authorization: Bearer <token>`.
 */
import { createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { NextFunction, Request, Response } from "express";
import type { RowDataPacket } from "mysql2";
import { pool } from "./db.ts";

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

const SCRYPT = { N: 2 ** 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const TOKEN_DAYS = 7;

export const hashPassword = async (password: string) => {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, 64, SCRYPT);
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString("base64")}$${hash.toString("base64")}`;
};

export const verifyPassword = async (password: string, stored: string) => {
  const [scheme, n, r, p, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64");
  const actual = await scryptAsync(password, Buffer.from(salt, "base64"), expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: SCRYPT.maxmem,
  });
  return timingSafeEqual(actual, expected);
};

/** Compared against when the username doesn't exist, so a wrong name takes as long as a wrong password. */
let dummyHash: Promise<string> | null = null;
const dummy = () => (dummyHash ??= hashPassword(randomBytes(16).toString("hex")));

export type Owner = { id: number; username: string };

const b64 = (data: string | Buffer) => Buffer.from(data).toString("base64url");
const sign = (secret: string, payload: string) =>
  createHmac("sha256", secret).update(payload).digest("base64url");

export const createToken = (secret: string, owner: Owner) => {
  const payload = b64(
    JSON.stringify({ sub: owner.id, u: owner.username, exp: Date.now() + TOKEN_DAYS * 86_400_000 }),
  );
  return { token: `${payload}.${sign(secret, payload)}`, expiresInDays: TOKEN_DAYS };
};

const readToken = (secret: string, token: string): { sub: number; exp: number } | null => {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(secret, payload));
  const actual = Buffer.from(signature);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return typeof data.sub === "number" && typeof data.exp === "number" && data.exp > Date.now()
      ? data
      : null;
  } catch {
    return null;
  }
};

type UserRow = RowDataPacket & { id: number; username: string; password_hash: string };

export const findUser = async (username: string) => {
  const [rows] = await pool.query<UserRow[]>(
    "SELECT id, username, password_hash FROM users WHERE username = ?",
    [username],
  );
  return rows[0] ?? null;
};

/** Checks a username and password; null when either is wrong. */
export const checkLogin = async (username: string, password: string): Promise<Owner | null> => {
  const user = await findUser(username);
  if (!user) {
    await verifyPassword(password, await dummy());
    return null;
  }
  return (await verifyPassword(password, user.password_hash))
    ? { id: Number(user.id), username: user.username }
    : null;
};

/** Express middleware: only a logged-in owner gets through. Sets `res.locals.owner`. */
export const requireOwner =
  (secret: string) => async (req: Request, res: Response, next: NextFunction) => {
    const header = req.get("authorization") ?? "";
    const data = header.startsWith("Bearer ") ? readToken(secret, header.slice(7).trim()) : null;
    if (!data) {
      res.status(401).json({ error: "Log in as the owner to do that." });
      return;
    }
    const [rows] = await pool.query<UserRow[]>("SELECT id, username FROM users WHERE id = ?", [
      data.sub,
    ]);
    if (!rows[0]) {
      res.status(401).json({ error: "That account no longer exists." });
      return;
    }
    res.locals.owner = { id: Number(rows[0].id), username: rows[0].username } satisfies Owner;
    next();
  };

/** Failed logins per IP: 10 in 15 minutes, then wait. In memory: Render runs one instance. */
const failures = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 15 * 60_000;
const MAX_FAILURES = 10;

export const loginBlocked = (ip: string) => {
  const entry = failures.get(ip);
  if (!entry || entry.resetAt < Date.now()) return 0;
  return entry.count >= MAX_FAILURES ? Math.ceil((entry.resetAt - Date.now()) / 60_000) : 0;
};

export const recordFailure = (ip: string) => {
  const now = Date.now();
  const entry = failures.get(ip);
  if (!entry || entry.resetAt < now) failures.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  else entry.count++;
  if (failures.size > 10_000) {
    for (const [key, value] of failures) if (value.resetAt < now) failures.delete(key);
  }
};

export const clearFailures = (ip: string) => failures.delete(ip);
