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
  ALBUM: {
    static: "/projects/:projectId/album/:albumId",
    get: ({ projectId, albumId }: { projectId: string; albumId: string }) => {
      return `/projects/${projectId}/album/${albumId}`;
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
