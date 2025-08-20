/**
 * Описание объекта
 * @constructor
 * @param static - Статичный url адрес который нужен для компонента <Route path={} />.
 * @param get - функция для выдачи URL
 */

export const reassignParam = "reassign";

export type ApplicationParams = {
  applicationId?: string;
  isReassign?: string;
  requestId?: string;
};

export const PublicRoutes = {
  MAIN: {
    static: "/"
  },
  ADMINISTRATION: {
    static: "/administration",
  },
  PROJECTS: {
    static: "/projects",
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
