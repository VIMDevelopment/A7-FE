import React, { ReactElement } from "react";
import { UserRole } from "../api/a7-service/model";
import { PublicRoutes } from "./routes";
import MainPage from "../pages/Main/Main";
import AdministrationPage from "../pages/Administration/Administration";
import AuthPage from "../pages/Auth/Auth";
import ProjectsPage from "../pages/Projects/Projects";
import ReportsPage from "../pages/Reports/Reports";
import SettingsPage from "../pages/Settings/Settings";
import StatisticsPage from "../pages/Statistics/Statistics";

export type Routes = {
  /**
   * Уникальный id
   */
  id: string;
  /**
   * Часть URL которая подставляется в <Route />
   */
  path: string;
  /**
   * Массив ролей необходимый для доступа к странице
   */
  roles: UserRole[];
  /**
   * Компонент страницы
   */
  component?: ReactElement;
};

export type RedirectRoutes = {
  id: string;
  path: string;
  roles: UserRole[];
};

export const ROUTES: Routes[] = [
  {
    id: "main",
    path: PublicRoutes.MAIN.static,
    roles: [
      UserRole.admin,
      UserRole.manager,
      UserRole.photographer,
      UserRole.seller,
    ],
    component: <MainPage />,
  },
  {
    id: "administration",
    path: PublicRoutes.ADMINISTRATION.static,
    roles: [
      UserRole.admin,
      UserRole.manager,
      UserRole.photographer,
      UserRole.seller,
    ],
    component: <AdministrationPage />,
  },
  {
    id: "auth",
    path: PublicRoutes.AUTH.static,
    roles: [
      UserRole.admin,
      UserRole.manager,
      UserRole.photographer,
      UserRole.seller,
    ],
    component: <AuthPage />,
  },
  {
    id: "projects",
    path: PublicRoutes.PROJECTS.static,
    roles: [
      UserRole.admin,
      UserRole.manager,
      UserRole.photographer,
      UserRole.seller,
    ],
    component: <ProjectsPage />,
  },
  {
    id: "reports",
    path: PublicRoutes.REPORTS.static,
    roles: [
      UserRole.admin,
      UserRole.manager,
      UserRole.photographer,
      UserRole.seller,
    ],
    component: <ReportsPage />,
  },
  {
    id: "settings",
    path: PublicRoutes.SETTINGS.static,
    roles: [
      UserRole.admin,
      UserRole.manager,
      UserRole.photographer,
      UserRole.seller,
    ],
    component: <SettingsPage />,
  },
  {
    id: "statistics",
    path: PublicRoutes.STATISTICS.static,
    roles: [
      UserRole.admin,
      UserRole.manager,
      UserRole.photographer,
      UserRole.seller,
    ],
    component: <StatisticsPage />,
  },
];

export const REDIRECTS: RedirectRoutes[] = [
  {
    id: "redirect",
    path: PublicRoutes.MAIN.static,
    roles: [
      UserRole.admin,
      UserRole.manager,
      UserRole.photographer,
      UserRole.seller,
    ],
  },
];
