import type { ElementType, FC } from "react";
import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export type MenuItem = {
  id?: string;
  path?: string;
  label: string;
  icon: ElementType;
  submenu?: MenuItem[] | null;
  roles?: string[];
  visibleIf?: (user: any) => boolean;
};

interface SidebarProps {
  menuItems: MenuItem[];
  activeMenu: string;
  setActiveMenu: (id: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (value: boolean) => void;
}

const Sidebar: FC<SidebarProps> = ({
  menuItems,
  activeMenu,
  setActiveMenu,
  sidebarOpen,
  setSidebarOpen,
}) => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [submenuOpen, setSubmenuOpen] = useState<Record<string, boolean>>({});
  const shouldCollapseSidebar = () =>
    typeof window === "undefined" ? true : window.innerWidth < 1024;

  const initials = useMemo(() => {
    const fallback = user?.email ?? "club@hub.vn";
    const source = user?.fullName ?? user?.username ?? fallback;
    return source
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "CL";
  }, [user]);

  const resolveItemKey = (item: MenuItem) => item.id ?? item.path ?? "";

  const handleMenuClick = (item: MenuItem) => {
    const key = resolveItemKey(item);
    if (item.submenu && item.submenu.length > 0) {
      if (key) {
        setSubmenuOpen((prev) => ({ ...prev, [key]: !prev[key] }));
      }
      return;
    }

    if (key) {
      setActiveMenu(key);
    }

    const targetPath = item.path ?? (key ? `/dashboard/${key}` : undefined);
    if (targetPath) {
      navigate(targetPath);
    }
    if (shouldCollapseSidebar()) {
      setSidebarOpen(false);
    }
  };

  const handleSubmenuClick = (subItem: MenuItem) => {
    const key = resolveItemKey(subItem);
    if (key) {
      setActiveMenu(key);
    }
    const targetPath = subItem.path ?? (key ? `/dashboard/${key}` : undefined);
    if (targetPath) {
      navigate(targetPath);
    }
    if (shouldCollapseSidebar()) {
      setSidebarOpen(false);
    }
  };

  const isActiveItem = (item: MenuItem) => {
    const key = resolveItemKey(item);
    return key ? key === activeMenu : false;
  };

  const hasActiveSubmenu = (item: MenuItem) =>
    item.submenu?.some((sub) => resolveItemKey(sub) === activeMenu) ?? false;

  const sidebarClasses = [
    "sidebar-container",
    sidebarOpen ? "translate-x-0" : "-translate-x-full",
    sidebarOpen ? "lg:translate-x-0" : "lg:-translate-x-full",
    "fixed inset-y-0 left-0 z-40 w-72 border-r border-slate-200 bg-white shadow-lg transition-transform duration-300",
  ].join(" ");

  return (
    <>
      <aside className={sidebarClasses}>
        <div className="flex h-full flex-col">
          <div className="border-b border-slate-200 px-5 py-5">
            <button type="button" onClick={() => navigate("/")} className="text-left">
              <p className="text-xl font-semibold text-slate-900">ClubHub</p>
              <p className="text-xs uppercase tracking-[0.4em] text-orange-400">Student clubs</p>
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-4 py-4">
            <div className="space-y-1">
              {menuItems.map((item) => (
                <div key={item.id ?? item.path ?? item.label} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => handleMenuClick(item)}
                    className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                      isActiveItem(item) || hasActiveSubmenu(item)
                        ? "border-orange-200 bg-orange-50 text-orange-600 shadow-sm"
                        : "border-transparent text-slate-500 hover:border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border text-base ${
                        isActiveItem(item) || hasActiveSubmenu(item)
                          ? "border-orange-200 bg-white text-orange-500"
                          : "border-slate-200 bg-white text-slate-400"
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                    </span>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.submenu && (
                      <ChevronDown
                        className={`h-4 w-4 transition ${
                          submenuOpen[resolveItemKey(item)] ? "rotate-180 text-orange-500" : "text-slate-400"
                        }`}
                      />
                    )}
                  </button>

                  {item.submenu && (
                    <div
                      className={`ml-6 border-l border-slate-100 pl-4 transition-all ${
                        submenuOpen[resolveItemKey(item)] ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                      } overflow-hidden`}
                    >
                      {item.submenu.map((subItem) => (
                        <button
                          type="button"
                          key={subItem.id ?? subItem.path ?? subItem.label}
                          onClick={() => handleSubmenuClick(subItem)}
                          className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
                            isActiveItem(subItem)
                              ? "bg-orange-50 text-orange-600"
                              : "text-slate-500 hover:bg-slate-50 hover:text-orange-500"
                          }`}
                        >
                          <subItem.icon className="h-3.5 w-3.5" />
                          <span>{subItem.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </nav>

          <div className="border-t border-slate-200 p-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-500 font-semibold">
                  {initials}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">
                    {loading ? "Ðang t?i..." : user?.fullName ?? user?.username ?? "Guest"}
                  </p>
                  <p className="text-xs text-slate-500">{user?.email ?? "guest@clubhub.vn"}</p>
                </div>
                {!loading && (
                  <span className="text-[10px] uppercase tracking-wide text-orange-500">
                    {user?.role?.name?.replace("ROLE_", "") ?? "USER"}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </>
  );
};

export default Sidebar;
