import {
  FiBriefcase,
  FiChevronLeft,
  FiChevronRight,
  FiCode,
  FiFolder,
  FiHome,
  FiInfo,
  FiMail,
  FiMenu,
  FiUser,
  FiX,
} from "react-icons/fi";

interface SidebarProps {
  activeSection: string;
  collapsed: boolean;
  mobileOpen: boolean;
  onCollapse: () => void;
  onNavigate: (section: string) => void;
  onMobileClose: () => void;
}

const navigation = [
  { id: "dashboard", label: "Dashboard", icon: FiHome },
  { id: "projects", label: "Projects", icon: FiFolder },
  { id: "experience", label: "Experience", icon: FiBriefcase },
  { id: "skills", label: "Skills & Technologies", icon: FiCode },
  { id: "about", label: "About Me", icon: FiInfo },
  { id: "contact", label: "Contact", icon: FiMail },
];

const Sidebar = ({
  activeSection,
  collapsed,
  mobileOpen,
  onCollapse,
  onNavigate,
  onMobileClose,
}: SidebarProps) => (
  <>
    {mobileOpen && (
      <button
        aria-label="Close navigation overlay"
        className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
        onClick={onMobileClose}
      />
    )}
    <aside
      className={`fixed inset-y-0 z-50 flex w-[280px] flex-col bg-white transition-all duration-300 dark:bg-slate-950 lg:left-0 ${collapsed ? "lg:w-[84px]" : "lg:w-[260px]"} ${mobileOpen ? "left-0" : "-left-[280px] max-lg:invisible"}`}
    >
      <div className="flex h-20 items-center justify-between px-5">
        <button
          className={`flex items-center gap-3 overflow-hidden text-left ${collapsed ? "lg:justify-center" : ""}`}
          onClick={() => onNavigate("dashboard")}
          aria-label="Go to dashboard"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-sm">
            KS
          </span>
          <span className={collapsed ? "lg:hidden" : ""}>
            <span className="block whitespace-nowrap text-sm font-bold text-slate-900 dark:text-white">
              Kenneth San Pedro
            </span>
            <span className="block whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
              Developer workspace
            </span>
          </span>
        </button>
        <button
          className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-900 dark:hover:text-white lg:hidden"
          onClick={onMobileClose}
          aria-label="Close navigation"
        >
          <FiX />
        </button>
      </div>
      <div data-lenis-prevent className="flex-1 overflow-y-auto px-3 py-6">
        <p
          className={`mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 ${collapsed ? "lg:hidden" : ""}`}
        >
          Workspace
        </p>
        <nav aria-label="Primary navigation" className="space-y-1">
          {navigation.map(({ id, label, icon: Icon }) => {
            const active = activeSection === id;
            return (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${active ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"} ${collapsed ? "lg:justify-center" : ""}`}
                title={collapsed ? label : undefined}
              >
                <Icon
                  className={`h-[18px] w-[18px] shrink-0 ${active ? "text-blue-600 dark:text-blue-400" : ""}`}
                />
                <span className={collapsed ? "lg:hidden" : ""}>{label}</span>
                {active && (
                  <span
                    className={`ml-auto h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400 ${collapsed ? "lg:hidden" : ""}`}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>
      <div className={`p-3 ${collapsed ? "lg:flex lg:justify-center" : ""}`}>
        <div
          className={`flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-900 ${collapsed ? "lg:p-2" : ""}`}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
            <FiUser />
          </span>
          <div className={collapsed ? "lg:hidden" : ""}>
            <p className="text-xs font-semibold text-slate-900 dark:text-white">
              Frontend Developer
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
              Dynamic Global Soft Inc.
            </p>
          </div>
        </div>
      </div>
      <button
        onClick={onCollapse}
        className="absolute -right-3 top-[86px] hidden h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-blue-400 lg:flex"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
      </button>
    </aside>
  </>
);

export const MobileMenuButton = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900 lg:hidden"
    aria-label="Open navigation"
  >
    <FiMenu className="h-5 w-5" />
  </button>
);

export default Sidebar;
