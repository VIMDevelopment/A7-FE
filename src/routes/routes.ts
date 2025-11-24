/**
 * Описание объекта
 * @constructor
 * @param static - Статичный url адрес который нужен для компонента <Route path={} />.
 * @param get - функция для выдачи URL
 */

export const PublicRoutes = {
  MAIN: {
    static: "/",
  },
  ADMINISTRATION: {
    static: "/administration",
  },
  PROJECTS: {
    static: "/projects",
  },
  PROJECT: {
    static: "/projects/:projectId",
    get: ({ projectId }: { projectId: string }) => {
      return `/projects/${projectId}`;
    },
  },
  SUBPROJECT: {
    static: "/projects/:projectId/subproject/:subprojectId",
    get: ({
      projectId,
      subprojectId,
    }: {
      projectId: string;
      subprojectId: string;
    }) => {
      return `/projects/${projectId}/subproject/${subprojectId}`;
    },
  },
  ALBUM: {
    static: "/projects/:projectId/subproject/:subprojectId/album/:albumId",
    get: ({
      projectId,
      subprojectId,
      albumId,
    }: {
      projectId: string;
      subprojectId: string;
      albumId: string;
    }) => {
      return `/projects/${projectId}/subproject/${subprojectId}/album/${albumId}`;
    },
  },
  REPORTS: {
    static: "/reports",
  },
  SETTINGS: {
    static: "/settings",
  },
  STATISTICS: {
    static: "/statistics",
  },
};
