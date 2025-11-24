import React, { ReactElement } from "react";
import { PublicRoutes } from "./routes";
import AdministrationPage from "../pages/Administration/Administration";
import ProjectsPage from "../pages/Projects/Projects";
import ReportsPage from "../pages/Reports/Reports";
import SettingsPage from "../pages/Settings/Settings";
import StatisticsPage from "../pages/Statistics/Statistics";
import AlbumPage from "../pages/Album/Album";
import { UserRole } from "../apiV2/a7-service/model";
import ProjectPage from "../pages/Project/Project";
import SubprojectPage from "../pages/Subproject/Subproject";

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

// TODO: доделать ролевые доступы для назначений
export const ROUTES: Routes[] = [
  {
    id: "administration",
    path: PublicRoutes.ADMINISTRATION.static,
    roles: [UserRole.admin],
    component: <AdministrationPage />,
  },
  {
    id: "projects",
    path: PublicRoutes.PROJECTS.static,
    roles: [UserRole.admin],
    component: <ProjectsPage />,
  },
  {
    id: "project",
    path: PublicRoutes.PROJECT.static,
    roles: [UserRole.admin],
    component: <ProjectPage />,
  },
  {
    id: "subproject",
    path: PublicRoutes.SUBPROJECT.static,
    roles: [UserRole.admin],
    component: <SubprojectPage />,
  },
  {
    id: "album",
    path: PublicRoutes.ALBUM.static,
    roles: [UserRole.admin],
    component: <AlbumPage />,
  },
  {
    id: "reports",
    path: PublicRoutes.REPORTS.static,
    roles: [UserRole.admin],
    component: <ReportsPage />,
  },
  {
    id: "settings",
    path: PublicRoutes.SETTINGS.static,
    roles: [UserRole.admin],
    component: <SettingsPage />,
  },
  {
    id: "statistics",
    path: PublicRoutes.STATISTICS.static,
    roles: [UserRole.admin],
    component: <StatisticsPage />,
  },
];

export const REDIRECTS: RedirectRoutes[] = [
  {
    id: "redirect",
    path: PublicRoutes.PROJECTS.static,
    roles: [UserRole.admin],
  },
];
