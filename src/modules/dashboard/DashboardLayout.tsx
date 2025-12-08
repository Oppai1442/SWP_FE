import { Outlet } from "react-router-dom";
import { Navbar, Sidebar } from "./components";
import { Settings, Users, Key, FileText, FlaskConical, Workflow, Bell, Building2, Compass } from 'lucide-react';
import { useEffect, useMemo, useState } from "react";
import { ROUTES } from "@/constant/routes";
import { useAuth } from "@/context/AuthContext";

const getInitialSidebarState = () => {
  if (typeof window === "undefined") {
    return false;
  }
  const stored = window.localStorage.getItem("dashboardSidebarOpen");
  if (stored !== null) {
    return stored === "true";
  }
  return window.innerWidth >= 1024;
};

const DashboardLayout = () => {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(getInitialSidebarState);
  const { user } = useAuth();

  // Define the type for menu items to include optional visibleIf
  type MenuItem = {
    id?: string;
    path?: string;
    label: string;
    icon: any;
    submenu?: MenuItem[] | null;
    roles?: string[];
    visibleIf?: (user: any) => boolean;
  };

  const menuItems: MenuItem[] = [
    {
      id: ROUTES.DASHBOARD.child.USER_MANAGEMENT.path,
      label: ROUTES.DASHBOARD.child.USER_MANAGEMENT.label,
      icon: Users,
      submenu: null,
      roles: ["ROLE_ADMIN"]
    },
    {
      id: ROUTES.DASHBOARD.child.PERMISSION_MANAGEMENT.path,
      label: ROUTES.DASHBOARD.child.PERMISSION_MANAGEMENT.label,
      icon: Key,
      submenu: null,
      roles: ["ROLE_ADMIN"]
    },
    {
      id: ROUTES.DASHBOARD.child.CLUB_QUEUE.path,
      label: ROUTES.DASHBOARD.child.CLUB_QUEUE.label,
      icon: Workflow,
      submenu: null,
      roles: ["ROLE_ADMIN"]
    },
    {
      id: ROUTES.DASHBOARD.child.CLUB_MANAGEMENT.path,
      label: ROUTES.DASHBOARD.child.CLUB_MANAGEMENT.label,
      icon: Building2,
      submenu: null,
      roles: ["ROLE_ADMIN"]
    },
    {
      id: ROUTES.DASHBOARD.child.MY_CLUB.path,
      label: ROUTES.DASHBOARD.child.MY_CLUB.label,
      icon: FlaskConical,
      submenu: null,
      roles: ["ROLE_USER", "ROLE_ADMIN", "ROLE_STAFF"]
    },
    {
      id: ROUTES.DASHBOARD.child.CLUB_BROWSER.path,
      label: ROUTES.DASHBOARD.child.CLUB_BROWSER.label,
      icon: Compass,
      submenu: null,
      roles: ["ROLE_USER", "ROLE_ADMIN", "ROLE_STAFF"]
    },
    // {
    //   id: 'ticket',
    //   label: 'Ticket',
    //   icon: Ticket,
    //   submenu: [
    //     {
    //       id: ROUTES.DASHBOARD.child.TICKET_MANAGEMENT.path,
    //       label: ROUTES.DASHBOARD.child.TICKET_MANAGEMENT.label,
    //       icon: FileCog,
    //       roles: ["ROLE_ADMIN", "ROLE_STAFF"]
    //     },
    //     {
    //       id: ROUTES.DASHBOARD.child.MY_TICKET.path,
    //       label: ROUTES.DASHBOARD.child.MY_TICKET.label,
    //       icon: ClipboardList,
    //       roles: ["ROLE_USER"]
    //     }
    //   ]
    // },
    {
      id: ROUTES.DASHBOARD.child.NOTIFICATION_MANAGEMENT.path,
      label: ROUTES.DASHBOARD.child.NOTIFICATION_MANAGEMENT.label,
      icon: Bell,
      submenu: null,
    },
    {
      id: ROUTES.DASHBOARD.child.ACCOUNT_SETTINGS.path,
      label: ROUTES.DASHBOARD.child.ACCOUNT_SETTINGS.label,
      icon: Settings,
      submenu: null,
    },
    {
      id: ROUTES.DASHBOARD.child.LOG.path,
      label: ROUTES.DASHBOARD.child.LOG.label,
      icon: FileText,
      submenu: null,
      roles: ["ROLE_ADMIN"]
    },
  ];



  const allowedMenuItems = useMemo(() => {
    return menuItems
      .map(item => {
        if (item.visibleIf && !item.visibleIf(user)) return null;

        if (item.submenu) {
          const filteredSubmenu = item.submenu.filter(sub =>
            (!sub.roles || (user && sub.roles.includes(user.role.name))) &&
            (!sub.visibleIf || sub.visibleIf(user))
          );

          if (filteredSubmenu.length > 0) {
            return {
              ...item,
              submenu: filteredSubmenu
            };
          }

          if (!item.roles || (user && item.roles.includes(user.role.name))) {
            return { ...item, submenu: [] };
          }

          return null;
        }

        if (!item.roles || (user && item.roles.includes(user.role.name))) return item;

        return null;
      })
      .filter(Boolean) as MenuItem[];
  }, [user]);


  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem("dashboardSidebarOpen", JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Sidebar
        menuItems={allowedMenuItems}
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      <div
        className={`flex min-h-screen flex-col bg-orange-50/10 transition-[margin-left] duration-300 ease-out ${sidebarOpen ? "lg:ml-72" : "lg:ml-0"
          }`}
      >
        <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
