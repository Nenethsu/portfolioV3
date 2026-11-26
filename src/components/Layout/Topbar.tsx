import { FiLogOut, FiMoon, FiSun, FiUser } from "react-icons/fi";
import { MobileMenuButton } from "./Sidebar";

interface TopbarProps {
  darkMode: boolean;
  onMenuOpen: () => void;
  /** Gets the button so the theme reveal can start from its position. */
  onThemeToggle: (button: HTMLButtonElement) => void;
  title: string;
  /** "Guest" or the owner's username. */
  account: string;
  onLogout: () => void;
}

const Topbar = ({
  darkMode,
  onMenuOpen,
  onThemeToggle,
  title,
  account,
  onLogout,
}: TopbarProps) => (
  <header className="sticky top-0 z-30 bg-slate-50/90 backdrop-blur dark:bg-slate-950/90">
    <div className="flex h-16 items-center justify-between gap-3 px-4 sm:h-20 sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <MobileMenuButton onClick={onMenuOpen} />
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">
            Workspace / Portfolio
          </p>
          <h1 className="truncate text-base font-bold text-slate-900 dark:text-white sm:text-lg">
            {title}
          </h1>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="hidden max-w-40 items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:bg-slate-900 dark:text-slate-300 sm:inline-flex">
          <FiUser className="shrink-0" />
          <span className="truncate">{account}</span>
        </span>
        <button
          onClick={onLogout}
          className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-700 dark:hover:text-blue-400"
          aria-label={`Log out (${account})`}
        >
          <FiLogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Log out</span>
        </button>
        <button
          onClick={(event) => onThemeToggle(event.currentTarget)}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-blue-300 hover:text-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-700 dark:hover:text-blue-400"
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {darkMode ? <FiSun className="h-4 w-4" /> : <FiMoon className="h-4 w-4" />}
        </button>
      </div>
    </div>
  </header>
);

export default Topbar;
