/** Portfolio API: owner login. Deployed on Render. */
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import { checkLogin, clearFailures, createToken, loginBlocked, recordFailure, requireOwner } from "./auth.ts";
import { loadConfig } from "./config.ts";
import { ensureSchema } from "./db.ts";

const config = loadConfig();
const app = express();

app.set("trust proxy", 1); // Render's proxy: req.ip is the visitor, not the proxy
app.disable("x-powered-by");
app.use(
  cors({
    origin: config.origins,
    methods: ["GET", "POST"],
    allowedHeaders: ["content-type", "authorization"],
    maxAge: 86_400,
  }),
);
app.use(express.json({ limit: "16kb" }));

// Render's health check, and what the site calls to wake the server up.
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/auth/login", async (req, res) => {
  const ip = req.ip ?? "unknown";
  const wait = loginBlocked(ip);
  if (wait) {
    res.status(429).json({ error: `Too many failed logins. Try again in ${wait} minute${wait === 1 ? "" : "s"}.` });
    return;
  }
  const { username, password } = (req.body ?? {}) as Record<string, unknown>;
  if (typeof username !== "string" || typeof password !== "string" || !username || !password) {
    res.status(400).json({ error: "Enter your username and password." });
    return;
  }
  const owner = await checkLogin(username.trim(), password);
  if (!owner) {
    recordFailure(ip);
    res.status(401).json({ error: "Wrong username or password." });
    return;
  }
  clearFailures(ip);
  res.json({ ...createToken(config.authSecret, owner), user: { username: owner.username } });
});

app.get("/api/auth/me", requireOwner(config.authSecret), (_req, res) => {
  res.json({ user: { username: res.locals.owner.username } });
});

app.use((_req, res) => {
  res.status(404).json({ error: "Not found." });
});

// Express 5 sends errors from async handlers here. It needs all 4 parameters to see an error handler.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof SyntaxError && "body" in error) {
    res.status(400).json({ error: "The request wasn't valid JSON." });
    return;
  }
  if ((error as { type?: string }).type === "entity.too.large") {
    res.status(413).json({ error: "That request is too big." });
    return;
  }
  console.error(error);
  res.status(500).json({ error: "The server had a problem. Try again in a moment." });
});

await ensureSchema();
app.listen(config.port, () => {
  console.log(`API listening on port ${config.port}; allowed sites: ${config.origins.join(", ")}`);
});
