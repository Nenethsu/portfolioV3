/** Settings come from environment variables: Render's dashboard in production, server/.env locally. */

const required = (name: string) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing environment variable ${name} (see server/README.md).`);
  return value;
};

export const loadConfig = () => {
  const authSecret = required("AUTH_SECRET");
  if (authSecret.length < 32) throw new Error("AUTH_SECRET must be at least 32 characters.");
  return {
    port: Number(process.env.PORT ?? 4100),
    authSecret,
    /** Sites allowed to call the API, comma-separated (the Netlify URL, localhost for dev). */
    origins: (process.env.FRONTEND_ORIGIN ?? "http://localhost:5173")
      .split(",")
      .map((origin) => origin.trim().replace(/\/$/, ""))
      .filter(Boolean),
  };
};

export type Config = ReturnType<typeof loadConfig>;
