import React, { ReactElement } from "react";
import { PublicRoutes } from "./routes";
import AdministrationPage from "../pages/Administration/Administration";
import ProjectsPage from "../pages/Projects/Projects";
// import ReportsPage from "../pages/Reports/Reports";
import SettingsPage from "../pages/Settings/Settings";
import StatisticsPage from "../pages/Statistics/Statistics";
import AlbumPage from "../pages/Album/Album";
import { UserRolesItem } from "../apiV2/a7-service/model";
import ProjectPage from "../pages/Project/Project";
import SubprojectPage from "../pages/Subproject/Subproject";
import RecognitionPage from "../pages/Recognition/Recognition";
import PromptsPage from "../pages/Prompts/Prompts";
import KnowledgeBasePage from "../pages/KnowledgeBase/KnowledgeBase";
import ModelExplorerPage from "../pages/ModelExplorer/ModelExplorer";
import { EXPLORER_VIEW_ROLES } from "../pages/ModelExplorer/access";

const ALL_ROLES = [
  UserRolesItem.admin,
  UserRolesItem.owner,
  UserRolesItem.agency,
  UserRolesItem.cluster,
  UserRolesItem.supervisor,
  UserRolesItem.maker,
  UserRolesItem.prompt,
  UserRolesItem.remote,
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
  roles: UserRolesItem[];
  /**
   * Компонент страницы
   */
  component?: ReactElement;
};

export type RedirectRoutes = {
  id: string;
  path: string;
  roles: UserRolesItem[];
};

// TODO: доделать ролевые доступы для назначений
export const ROUTES: Routes[] = [
  {
    id: "administration",
    path: PublicRoutes.ADMINISTRATION.static,
    roles: [
      UserRolesItem.admin,
      UserRolesItem.owner,
      UserRolesItem.agency,
      UserRolesItem.cluster,
      UserRolesItem.supervisor,
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
  {
    id: "album-ready-product",
    path: PublicRoutes.ALBUM_READY_PRODUCT.static,
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
    id: "statistics",
    path: PublicRoutes.STATISTICS.static,
    roles: ALL_ROLES,
    component: <StatisticsPage />,
  },
  {
    id: "knowledge-base",
    path: PublicRoutes.KNOWLEDGE_BASE.static,
    roles: ALL_ROLES,
    component: <KnowledgeBasePage />,
  },
  {
    // Model Explorer (R-11): видят админ и руководители; запуск — только админ (гейт внутри страницы и на BE)
    id: "model-explorer",
    path: PublicRoutes.MODEL_EXPLORER.static,
    roles: EXPLORER_VIEW_ROLES,
    component: <ModelExplorerPage />,
  },
];

export const REDIRECTS: RedirectRoutes[] = [
  {
    id: "projects",
    path: PublicRoutes.PROJECTS.static,
    roles: [UserRolesItem.admin],
  },
];
