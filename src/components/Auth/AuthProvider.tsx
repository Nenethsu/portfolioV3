import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { SESSION_EXPIRED, api, whileWaking } from "../../lib/api";
import { AuthContext, readSession, saveSession, type Auth, type Session } from "../../lib/session";

type LoginResponse = { token: string; expiresInDays: number; user: { username: string } };

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(readSession);
  const [notice, setNotice] = useState("");

  const update = useCallback((next: Session | null) => {
    saveSession(next);
    setSession(next);
  }, []);

  // The server turned the owner's token down (expired, or the account was removed).
  useEffect(() => {
    const expired = () => {
      setNotice("Your login expired. Log in again.");
      update(null);
    };
    window.addEventListener(SESSION_EXPIRED, expired);
    return () => window.removeEventListener(SESSION_EXPIRED, expired);
  }, [update]);

  const value = useMemo<Auth>(
    () => ({
      session,
      notice,
      loginAsOwner: async (username, password, onSlow) => {
        const res = await whileWaking(
          api<LoginResponse>("/api/auth/login", { method: "POST", body: { username, password } }),
          onSlow,
        );
        setNotice("");
        update({
          role: "owner",
          username: res.user.username,
          token: res.token,
          expiresAt: Date.now() + res.expiresInDays * 86_400_000,
        });
      },
      loginAsGuest: () => {
        setNotice("");
        update({ role: "guest" });
      },
      logout: () => {
        setNotice("");
        update(null);
      },
    }),
    [notice, session, update],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
