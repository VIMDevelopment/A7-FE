import React, { useEffect, useMemo } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { getProfileFx, useProfile } from "./auth/auth";
import { useShowPermissions } from "./auth/userData";
import { QueryClient, QueryClientProvider } from "react-query";
import { REDIRECTS, ROUTES } from "./routes/constants";
import SideMenuWrapper from "./components/SideMenuWrapper/SideMenuWrapper";
import PageWrapper from "./components/PageWrapper/PageWrapper";
import AuthPage from "./pages/Auth/Auth";
import { showNotification } from "./components/ShowNotification";

const config = new QueryClient({
  defaultOptions: {
    mutations: {
      onError: (err) =>
        showNotification({
          type: "error",
          message: (err as any)?.response?.data?.message ?? "",
        }),
    },
    queries: {
      onError: (err) =>
        showNotification({
          type: "error",
          message: (err as any)?.response?.data?.message ?? "",
        }),
      retry: false,
      staleTime: 20_000,
      refetchOnWindowFocus: false,
      cacheTime: 20_000,
    },
  },
});

const App = () => {
  const { data, error } = useProfile();
  const { getRoutePrivileges, hasPrivileges } = useShowPermissions();

  useEffect(() => {
    void getProfileFx();
  }, []);

  const routes = useMemo(() => {
    const routes = ROUTES.filter((route) =>
      hasPrivileges(getRoutePrivileges(route))
    ).map((item) => (
      <Route key={item.id} path={item.path} element={item.component} />
    ));

    const redirects = REDIRECTS.filter((route) =>
      hasPrivileges(getRoutePrivileges(route))
    ).map((item) => (
      <Route
        key={item.id}
        path="*"
        element={<Navigate replace to={item.path} />}
      />
    ));

    return [...routes, ...redirects];
  }, [getRoutePrivileges, hasPrivileges]);

  const isHaveUserRoles = useMemo(() => {
    const acceptedRoles = new Set(ROUTES.flatMap((elem) => elem.roles));

    const isHaveUserRoles = (data?.role ? [data.role] : []).some((role) =>
      acceptedRoles.has(role)
    );

    return isHaveUserRoles;
  }, [data?.role]);

  if (error) {
    return (
      <QueryClientProvider client={config}>
        <AuthPage />
      </QueryClientProvider>
    );
  }

  if (data && !isHaveUserRoles) {
    return <>У вас нет прав доступа</>;
  }

  return (
    <QueryClientProvider client={config}>
      <Router>
        <SideMenuWrapper>
          <PageWrapper>
            <Routes>{routes}</Routes>
          </PageWrapper>
        </SideMenuWrapper>
      </Router>
    </QueryClientProvider>
  );
};

export default App;
