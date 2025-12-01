import React, { Suspense, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, matchPath } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Context
import { AuthProvider } from "./context/AuthContext";
import { STOMPProvider } from "./context/STOMP";
import { NotificationProvider } from "./context/NotificationContext";

// Config & Constants
import { routes } from "./routes";
import { pageConfigs } from "./configs/pageConfig";
import { ROUTES } from "./constant/routes";

// Components
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { Loading } from "@/components/Loading"; // Thêm import này
import { ServerStatusWatcher } from "./components/ServerStatusWatcher/ServerStatusWatcher";

// Styles
import styles from "./styles/App.module.css";
import RequireAuth from "./components/RequireAuth/RequireAuth";

type RouteLabelEntry = {
  path: string;
  label: string;
};

const buildRouteLabelEntries = (): RouteLabelEntry[] => {
  const entries: RouteLabelEntry[] = [];

  Object.values(ROUTES).forEach((route: any) => {
    if (!route || typeof route !== "object") {
      return;
    }

    if (route.path && route.label) {
      entries.push({ path: route.path, label: route.label });
    }

    if (route.child && typeof route.child === "object") {
      Object.values(route.child).forEach((child: any) => {
        if (!child || typeof child !== "object" || !child.path || !child.label) {
          return;
        }

        const childPath =
          child.path.startsWith("/") || !route.path
            ? child.path
            : `${route.path.replace(/\/$/, "")}/${child.path}`;

        entries.push({ path: childPath, label: child.label });
      });
    }
  });

  return entries.sort((a, b) => b.path.length - a.path.length);
};

const ROUTE_LABEL_ENTRIES = buildRouteLabelEntries();

const getRouteLabel = (pathname: string): string => {
  for (const entry of ROUTE_LABEL_ENTRIES) {
    const matched = matchPath({ path: entry.path, end: true }, pathname);
    if (matched) {
      return entry.label;
    }
  }

  if (ROUTES.NOT_FOUND?.label) {
    return ROUTES.NOT_FOUND.label;
  }

  if (typeof document !== "undefined") {
    return document.title ?? "";
  }

  return "";
};

const client = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  let matchedConfig = pageConfigs[ROUTES.NOT_FOUND.path];

  const sortedPageConfigs = Object.entries(pageConfigs).sort(([a], [b]) => b.length - a.length);

  for (const [path, cfg] of sortedPageConfigs) {
    const matched = matchPath({ path, end: true }, location.pathname);
    if (matched) {
      matchedConfig = cfg;
      break;
    }
  }

  useEffect(() => {
    const label = getRouteLabel(location.pathname);
    if (typeof document !== "undefined" && label) {
      document.title = label;
    }
  }, [location.pathname]);

  return (
    <STOMPProvider>
      <AuthProvider>
        <NotificationProvider>
          {matchedConfig.showNav && <Navbar />}
          <main className={styles.mainContainer}>{children}</main>
          {matchedConfig.showFooter && <Footer />}
          <ServerStatusWatcher />
        </NotificationProvider>
      </AuthProvider>
    </STOMPProvider>
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={client}>
      <Suspense
        fallback={
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100vh",
              width: "100%",
            }}
          >
            <Loading isVisible variant="fullscreen" />
          </div>
        }
      >
        {" "}
        {/* Thay thế div loading bằng Loading component */}
        <Router>
          <Layout>
            <Routes>
              {routes.map((route) => {
                const routeElement = route.authOnly
                  ? <RequireAuth>{route.element}</RequireAuth>
                  : route.element;

                return (
                  <Route key={route.path} path={route.path} element={routeElement}>
                    {"children" in route &&
                      Array.isArray(route.children) &&
                      route.children.map((child: any) => {
                        const childElement = child.authOnly
                          ? <RequireAuth>{child.element}</RequireAuth>
                          : child.element;

                        return (
                          <Route
                            key={child.path ?? "index"}
                            path={child.index ? undefined : child.path}
                            index={child.index ?? false}
                            element={childElement}
                          />
                        );
                      })}
                  </Route>
                );
              })}
            </Routes>
          </Layout>
        </Router>
      </Suspense>
    </QueryClientProvider>
  );
};

export default App;
