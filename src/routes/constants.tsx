import React, { ReactElement } from "react";
import { UserRole } from "../api/a7-service/model";
import { PublicRoutes } from "./routes";
import MainPage from "../pages/Main/Main";
import AdministrationPage from "../pages/Administration/Administration";
import ProjectsPage from "../pages/Projects/Projects";
import ReportsPage from "../pages/Reports/Reports";
import SettingsPage from "../pages/Settings/Settings";
import StatisticsPage from "../pages/Statistics/Statistics";
import ProjectPage from "../pages/Project/Project";
import AlbumPage from "../pages/Album/Album";

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
    roles: [UserRole.admin, UserRole.manager],
    component: <AdministrationPage />,
  },
  {
    id: "projects",
    path: PublicRoutes.PROJECTS.static,
    roles: [UserRole.admin, UserRole.photographer, UserRole.manager],
    component: <ProjectsPage />,
  },
  {
    id: "project",
    path: PublicRoutes.PROJECT.static,
    roles: [UserRole.admin, UserRole.photographer, UserRole.manager],
    component: <ProjectPage />,
  },
  {
    id: "album",
    path: PublicRoutes.ALBUM.static,
    roles: [UserRole.admin, UserRole.photographer, UserRole.manager],
    component: <AlbumPage />,
  },
  {
    id: "reports",
    path: PublicRoutes.REPORTS.static,
    roles: [UserRole.admin, UserRole.manager],
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
    roles: [UserRole.admin, UserRole.seller, UserRole.manager],
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
