import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/Layout/Sidebar";
import SmoothScroll from "../components/Layout/SmoothScroll";
import { setScrollLocked } from "../lib/motion";
import { revealTheme } from "../lib/theme";
import Topbar from "../components/Layout/Topbar";

const sectionTitles: Record<string, string> = {
  dashboard: "Dashboard",
  projects: "Projects",
  experience: "Experience",
  skills: "Skills & Technologies",
  lab: "AI Lab",
  about: "About Me",
  contact: "Contact",
};

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("theme") === "dark",
  );
  const activeSection = location.pathname.split("/")[1] || "dashboard";

  // Layout effect: it runs inside the theme reveal's flushSync, so the class is set before the new snapshot.
  useLayoutEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  // While the mobile menu is open: the page behind it can't scroll, and Escape closes it.
  useEffect(() => {
    if (!mobileOpen) return;
    setScrollLocked(true);
    const onKey = (event: KeyboardEvent) =>
      event.key === "Escape" && setMobileOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      setScrollLocked(false);
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

  const navigateTo = (section: string) => {
    navigate(`/${section}`);
    setMobileOpen(false);
  };

  const title = useMemo(
    () => sectionTitles[activeSection] ?? "Dashboard",
    [activeSection],
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-slate-300">
      <SmoothScroll />
      <Sidebar
        activeSection={activeSection}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCollapse={() => setCollapsed((value) => !value)}
        onNavigate={navigateTo}
        onMobileClose={() => setMobileOpen(false)}
      />
      {/* overflow-x-clip: elements waiting off to the side for their scroll animation must not widen the page on phones (clip, unlike hidden, keeps the sticky top bar working). */}
      <div
        className={`min-h-screen overflow-x-clip transition-[padding] duration-300 ${collapsed ? "lg:pl-[84px]" : "lg:pl-[260px]"}`}
      >
        <Topbar
          darkMode={darkMode}
          onMenuOpen={() => setMobileOpen(true)}
          onThemeToggle={(button) =>
            revealTheme(button, () => setDarkMode((value) => !value))
          }
          title={title}
        />
        <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
