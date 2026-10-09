import { ProjectPreviewDto, UserRolesItem } from "../../apiV2/a7-service/model";
import { getRoleDescription } from "../../components/SideMenu/helpers";

const HIERARCHICAL_ROLES: UserRolesItem[] = [
  UserRolesItem.admin,
  UserRolesItem.owner,
  UserRolesItem.agency,
  UserRolesItem.cluster,
  UserRolesItem.supervisor,
  UserRolesItem.maker,
];

const CAPABILITY_ROLES: UserRolesItem[] = [
  UserRolesItem.prompt,
  UserRolesItem.remote,
];

const CAPABILITY_MANAGERS: UserRolesItem[] = [
  UserRolesItem.admin,
  UserRolesItem.owner,
];

// Уровни — как на бэке (A7-BE common/roles.guard.ts ROLE_HIERARCHY): админ выше владельца.
const ROLE_PRIORITY: Record<UserRolesItem, number> = {
  admin: 6,
  owner: 5,
  agency: 4,
  cluster: 3,
  supervisor: 2,
  maker: 1,
  prompt: 0,
  remote: 0,
};

/** Возвращает максимальный иерархический уровень из массива ролей. */
export const getEffectiveLevel = (roles?: UserRolesItem[]): number => {
  if (!roles?.length) return 0;
  return Math.max(
    0,
    ...roles
      .filter((r) => HIERARCHICAL_ROLES.includes(r))
      .map((r) => ROLE_PRIORITY[r] ?? 0)
  );
};

/** «Суперадмин» = роль admin: видит все филиалы (нынешние и будущие) и имеет все права. */
export const isSuperadmin = (roles?: UserRolesItem[]): boolean =>
  (roles ?? []).includes(UserRolesItem.admin);

/** Выбор ролей в форме: с «Суперадмином» другие роли не нужны — остаётся только он. */
export const applyRolesSelection = (
  _prev: UserRolesItem[],
  next: UserRolesItem[]
): UserRolesItem[] => (isSuperadmin(next) ? [UserRolesItem.admin] : next);

/** Кого можно выбрать для правки: админ — всех, кроме других админов; остальные — строго ниже себя. */
export const canEditUser = (
  currentRoles?: UserRolesItem[],
  targetRoles?: UserRolesItem[]
): boolean => {
  if (isSuperadmin(currentRoles)) return !isSuperadmin(targetRoles);
  return getEffectiveLevel(targetRoles) < getEffectiveLevel(currentRoles);
};

/**
 * Филиал избранного там, где его нет в URL (Explorer): первый филиал юзера, а у суперадмина
 * без списка филиалов — первый филиал из общего списка.
 */
export const favoritesBranchId = (
  workplace: string[] | undefined,
  projects: { id?: string }[]
): string | undefined => workplace?.[0] ?? projects[0]?.id;

/** Опции для мульти-селекта ролей при создании/редактировании пользователя. */
export const getRolesOptions = (currentUserRoles?: UserRolesItem[]) => {
  const currentLevel = getEffectiveLevel(currentUserRoles);
  const canManageCapabilities = (currentUserRoles ?? []).some((r) =>
    CAPABILITY_MANAGERS.includes(r)
  );
  // Админ («Суперадмин») назначает любые роли, включая админа, — как разрешает бэк
  // (ROLE_CREATION_PERMISSIONS.admin). Остальные — только строго ниже себя.
  const isAdmin = isSuperadmin(currentUserRoles);

  const hierarchical = HIERARCHICAL_ROLES.filter(
    (r) => isAdmin || (ROLE_PRIORITY[r] ?? 0) < currentLevel
  ).map((r) => ({ key: r, value: r, label: getRoleDescription(r) }));

  const capabilities = canManageCapabilities
    ? CAPABILITY_ROLES.map((r) => ({
        key: r,
        value: r,
        label: getRoleDescription(r),
      }))
    : [];

  return [...hierarchical, ...capabilities];
};

export const getWorkplaceOptions = (
  projects: ProjectPreviewDto[],
  userRoles?: UserRolesItem[],
  userWorkplace?: string[]
) =>
  projects.map((item) => ({
    key: item.id,
    value: item.id,
    label: item.name,
    disabled:
      (userRoles ?? []).includes(UserRolesItem.supervisor) &&
      !userWorkplace?.includes(item.id ?? ""),
  }));
