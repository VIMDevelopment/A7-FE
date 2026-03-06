import React, { ReactElement } from "react";
import { PublicRoutes } from "./routes";
import AdministrationPage from "../pages/Administration/Administration";
import ProjectsPage from "../pages/Projects/Projects";
// import ReportsPage from "../pages/Reports/Reports";
import SettingsPage from "../pages/Settings/Settings";
// import StatisticsPage from "../pages/Statistics/Statistics";
import AlbumPage from "../pages/Album/Album";
import { UserRole } from "../apiV2/a7-service/model";
import ProjectPage from "../pages/Project/Project";
import SubprojectPage from "../pages/Subproject/Subproject";
import RecognitionPage from "../pages/Recognition/Recognition";
import DiskPage from "../pages/Disk/Disk";
import DiskCallbackPage from "../pages/Disk/DiskCallback";
import PromptsPage from "../pages/Prompts/Prompts";

const ALL_ROLES = [
  UserRole.admin,
  UserRole.owner,
  UserRole.agency,
  UserRole.cluster,
  UserRole.supervisor,
  UserRole.maker,
];

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
    roles: [
      UserRole.admin,
      UserRole.owner,
      UserRole.agency,
      UserRole.cluster,
      UserRole.supervisor,
    ],
    component: <AdministrationPage />,
  },
  {
    id: "projects",
    path: PublicRoutes.PROJECTS.static,
    roles: ALL_ROLES,
    component: <ProjectsPage />,
  },
  {
    id: "project",
    path: PublicRoutes.PROJECT.static,
    roles: ALL_ROLES,
    component: <ProjectPage />,
  },
  {
    id: "subproject",
    path: PublicRoutes.SUBPROJECT.static,
    roles: ALL_ROLES,
    component: <SubprojectPage />,
  },
  {
    id: "album",
    path: PublicRoutes.ALBUM.static,
    roles: ALL_ROLES,
    component: <AlbumPage />,
  },
  // {
  //   id: "reports",
  //   path: PublicRoutes.REPORTS.static,
  //   roles: [],
  //   component: <ReportsPage />,
  // },
  {
    id: "settings",
    path: PublicRoutes.SETTINGS.static,
    roles: ALL_ROLES,
    component: <SettingsPage />,
  },
  {
    id: "prompts",
    path: PublicRoutes.PROMPTS.static,
    roles: ALL_ROLES,
    component: <PromptsPage />,
  },
  {
    id: "recognition",
    path: PublicRoutes.RECOGNITION.static,
    roles: ALL_ROLES,
    component: <RecognitionPage />,
  },
  {
    id: "disk",
    path: PublicRoutes.DISK.static,
    roles: ALL_ROLES,
    component: <DiskPage />,
  },
  {
    id: "disk-auth-callback",
    path: PublicRoutes.DISK_AUTH_CALLBACK.static,
    roles: ALL_ROLES,
    component: <DiskCallbackPage />,
  },
  // {
  //   id: "statistics",
  //   path: PublicRoutes.STATISTICS.static,
  //   roles: [],
  //   component: <StatisticsPage />,
  // },
];

export const REDIRECTS: RedirectRoutes[] = [
  {
    id: "projects",
    path: PublicRoutes.PROJECTS.static,
    roles: [UserRole.admin],
  },
];
