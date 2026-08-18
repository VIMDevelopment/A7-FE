import { UserRolesItem } from "../../apiV2/a7-service/model";

/**
 * Доступ к Model Explorer (R-11, решение Ивана 18.08):
 * вкладку видят админ и руководители, запуск платной обработки — только админ.
 * Зеркало серверных правил (истина — гарды A7-BE /explorer).
 */
export const EXPLORER_VIEW_ROLES: UserRolesItem[] = [
  UserRolesItem.admin,
  UserRolesItem.owner,
  UserRolesItem.agency,
  UserRolesItem.cluster,
  UserRolesItem.supervisor,
];

export const canRunExplorer = (roles?: UserRolesItem[]): boolean =>
  (roles ?? []).includes(UserRolesItem.admin);
