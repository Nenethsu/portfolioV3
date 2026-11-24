import { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/Layout/Sidebar";
import SmoothScroll from "../components/Layout/SmoothScroll";
import Topbar from "../components/Layout/Topbar";

const sectionTitles: Record<string, string> = { dashboard: "Dashboard", projects: "Projects", experience: "Experience", skills: "Skills & Technologies", about: "About Me", contact: "Contact" };

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") === "dark");
  const activeSection = location.pathname.split("/")[1] || "dashboard";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const navigateTo = (section: string) => {
    navigate(`/${section}`);
    setMobileOpen(false);
  };

  const title = useMemo(() => sectionTitles[activeSection] ?? "Dashboard", [activeSection]);

  return <div className="min-h-screen bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-slate-300">
    <SmoothScroll />
    <Sidebar activeSection={activeSection} collapsed={collapsed} mobileOpen={mobileOpen} onCollapse={() => setCollapsed((value) => !value)} onNavigate={navigateTo} onMobileClose={() => setMobileOpen(false)} />
    <div className={`min-h-screen transition-[padding] duration-300 ${collapsed ? "lg:pl-[84px]" : "lg:pl-[260px]"}`}>
      <Topbar darkMode={darkMode} onMenuOpen={() => setMobileOpen(true)} onThemeToggle={() => setDarkMode((value) => !value)} title={title} />
      <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8"><Outlet /></main>
      <footer className="px-4 py-6 text-center text-xs text-slate-500 dark:text-slate-500">© 2026 Kenneth San Pedro · Built with React and TypeScript</footer>
    </div>
  </div>;
};

export default MainLayout;
