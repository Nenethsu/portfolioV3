import { useLayoutEffect, useState, type FormEvent } from "react";
import { FiAlertTriangle, FiArrowRight, FiLoader, FiLogIn } from "react-icons/fi";
import { ApiError } from "../lib/api";
import { useAuth } from "../lib/session";

/** The first screen: the owner logs in, everyone else continues as a guest. */
const Login = () => {
  const { loginAsOwner, loginAsGuest, notice } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [waking, setWaking] = useState(false);

  // The main layout normally applies the saved theme; this screen comes before it.
  useLayoutEffect(() => {
    document.documentElement.classList.toggle("dark", localStorage.getItem("theme") === "dark");
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (!username.trim() || !password) {
      setError("Enter your username and password.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      await loginAsOwner(username.trim(), password, setWaking);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong. Try again.");
      setBusy(false);
    }
  };

  const message = error || notice;
  const field =
    "mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base text-slate-950 outline-none transition focus:border-blue-400 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-blue-600 sm:text-sm";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 text-slate-700 dark:bg-slate-950 dark:text-slate-300">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src="/favicon.svg" alt="" className="h-12 w-12" />
          <h1 className="mt-4 text-xl font-bold text-slate-950 dark:text-white">Welcome</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Log in, or continue as a guest to look around.
          </p>
        </div>

        <form onSubmit={submit} className="dashboard-panel space-y-4 p-6" noValidate>
          <label className="block">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Username</span>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              disabled={busy}
              className={field}
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              disabled={busy}
              className={field}
            />
          </label>

          {message && (
            <p
              role="alert"
              className="flex items-start gap-2 text-xs leading-5 text-red-600 dark:text-red-400"
            >
              <FiAlertTriangle className="mt-0.5 shrink-0" /> {message}
            </p>
          )}
          {waking && (
            <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
              Waking up the server. It sleeps when nobody is using it, so this can take up to a
              minute.
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? <FiLoader className="animate-spin" /> : <FiLogIn />} Login
          </button>
          <button
            type="button"
            onClick={loginAsGuest}
            disabled={busy}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-600 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:border-blue-700 dark:hover:text-blue-400"
          >
            Login as a Guest <FiArrowRight />
          </button>
        </form>
      </div>
    </main>
  );
};

export default Login;
