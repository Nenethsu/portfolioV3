/**
 * Who is using the site: nobody yet (login screen), a guest, or the owner.
 * The owner's token lasts 7 days (localStorage); a guest lasts until the browser closes (sessionStorage).
 */
import { createContext, useContext } from "react";

export type Session =
  | { role: "guest" }
  | { role: "owner"; username: string; token: string; expiresAt: number };

export type Auth = {
  session: Session | null;
  /** Shown on the login screen, e.g. "Your login expired." */
  notice: string;
  loginAsOwner: (username: string, password: string, onSlow: (slow: boolean) => void) => Promise<void>;
  loginAsGuest: () => void;
  logout: () => void;
};

const OWNER_KEY = "portfolio-owner";
const GUEST_KEY = "portfolio-guest";

export const readSession = (): Session | null => {
  try {
    const owner = JSON.parse(localStorage.getItem(OWNER_KEY) ?? "null") as Session | null;
    if (owner?.role === "owner" && owner.expiresAt > Date.now()) return owner;
    localStorage.removeItem(OWNER_KEY);
  } catch {
    localStorage.removeItem(OWNER_KEY);
  }
  return sessionStorage.getItem(GUEST_KEY) ? { role: "guest" } : null;
};

export const saveSession = (session: Session | null) => {
  localStorage.removeItem(OWNER_KEY);
  sessionStorage.removeItem(GUEST_KEY);
  if (session?.role === "owner") localStorage.setItem(OWNER_KEY, JSON.stringify(session));
  if (session?.role === "guest") sessionStorage.setItem(GUEST_KEY, "1");
};

export const AuthContext = createContext<Auth | null>(null);

export const useAuth = () => {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("useAuth needs <AuthProvider>.");
  return auth;
};

/** The owner's token, or null for guests. */
export const useOwnerToken = () => {
  const { session } = useAuth();
  return session?.role === "owner" ? session.token : null;
};
