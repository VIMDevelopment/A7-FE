import React, { ReactElement, lazy } from "react";
import { PublicRoutes } from "./routes";
// import ReportsPage from "../pages/Reports/Reports";
import { UserRolesItem } from "../apiV2/a7-service/model";
import { EXPLORER_VIEW_ROLES } from "../pages/ModelExplorer/access";

// R-54: страницы грузятся по требованию — каждая своим файлом (Suspense — в App).
const AdministrationPage = lazy(() => import("../pages/Administration/Administration"));
const ProjectsPage = lazy(() => import("../pages/Projects/Projects"));
const SettingsPage = lazy(() => import("../pages/Settings/Settings"));
const StatisticsPage = lazy(() => import("../pages/Statistics/Statistics"));
const AlbumPage = lazy(() => import("../pages/Album/Album"));
const ProjectPage = lazy(() => import("../pages/Project/Project"));
const SubprojectPage = lazy(() => import("../pages/Subproject/Subproject"));
const PromptsPage = lazy(() => import("../pages/Prompts/Prompts"));
const KnowledgeBasePage = lazy(() => import("../pages/KnowledgeBase/KnowledgeBase"));
const ModelExplorerPage = lazy(() => import("../pages/ModelExplorer/ModelExplorer"));

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

// Неизвестный или недоступный роли адрес → «Файлы» для ВСЕХ ролей (раньше только для admin —
// остальные видели пустую страницу; в т.ч. старые адреса вырезанных экранов, R-50.2).
export const REDIRECTS: RedirectRoutes[] = [
  {
    id: "projects",
    path: PublicRoutes.PROJECTS.static,
    roles: ALL_ROLES,
  },
];
