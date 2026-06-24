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
import { ConfigProvider } from "antd";
import ruRU from "antd/locale/ru_RU";
import { REDIRECTS, ROUTES } from "./routes/constants";
import { PublicRoutes } from "./routes/routes";
import SideMenuWrapper from "./components/SideMenuWrapper/SideMenuWrapper";
import PageWrapper from "./components/PageWrapper/PageWrapper";
import AuthPage from "./pages/Auth/Auth";
import PolicyPage from "./pages/Policy/Policy";
import NoAccessPage from "./pages/NoAccess/NoAccess";
import { showNotification } from "./components/ShowNotification";
import { loadFaceApiModels } from "./utils/faceDetection";

const antdTheme = {
  token: {
    colorPrimary: "#8B5CF6",
    colorLink: "#8B5CF6",
    colorText: "#1F2328",
    colorTextSecondary: "#6B7280",
    colorBorder: "#E5E7EB",
    colorBgContainer: "#FFFFFF",
    colorBgElevated: "#FFFFFF",
    colorError: "#EF4444",
    borderRadius: 8,
    fontFamily:
      'Montserrat, Inter, -apple-system, "Segoe UI", Roboto, sans-serif',
    fontSize: 14,
  },
};

const config = new QueryClient({
  defaultOptions: {
    mutations: {
      onError: (err) =>
        showNotification({
          type: "error",
          message: (err as any)?.response?.data?.message ?? "Произошла ошибка на сервере",
        }),
    },
    queries: {
      onError: (err) =>
        showNotification({
          type: "error",
          message: (err as any)?.response?.data?.message ?? "Произошла ошибка на сервере",
        }),
      retry: false,
      staleTime: 20_000,
      refetchOnWindowFocus: false,
      cacheTime: 20_000,
    },
  },
});

const AppShell = () => {
  const { data, error } = useProfile();
  const { getRoutePrivileges, hasPrivileges } = useShowPermissions();

  useEffect(() => {
    void getProfileFx();
    // Прогреваем модели face-api в фоне сразу при старте приложения.
    // К моменту, когда пользователь откроет экран распознавания, модели
    // уже будут в памяти — не будет блокировки кнопки «Загрузка моделей...».
    void loadFaceApiModels().catch((err) => {
      console.warn("Не удалось предварительно загрузить модели face-api", err);
    });
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

    const isHaveUserRoles = (data?.roles ?? []).some((role) =>
      acceptedRoles.has(role)
    );

    return isHaveUserRoles;
  }, [data?.roles]);

  if (error) {
    return <Navigate to={PublicRoutes.LOGIN.static} replace />;
  }

  if (data && !isHaveUserRoles) {
    return <Navigate to={PublicRoutes.NO_ACCESS.static} replace />;
  }

  return (
    <SideMenuWrapper>
      <PageWrapper>
        <Routes>{routes}</Routes>
      </PageWrapper>
    </SideMenuWrapper>
  );
};

const App = () => {
  return (
    <ConfigProvider theme={antdTheme} locale={ruRU}>
      <QueryClientProvider client={config}>
        <Router>
          <Routes>
            <Route path={PublicRoutes.LOGIN.static} element={<AuthPage />} />
            <Route path={PublicRoutes.NO_ACCESS.static} element={<NoAccessPage />} />
            <Route path={PublicRoutes.POLICY.static} element={<PolicyPage />} />
            <Route path="*" element={<AppShell />} />
          </Routes>
        </Router>
      </QueryClientProvider>
    </ConfigProvider>
  );
};

export default App;
