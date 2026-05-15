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

const ROLE_PRIORITY: Record<UserRolesItem, number> = {
  admin: 5,
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

/** Опции для мульти-селекта ролей при создании/редактировании пользователя. */
export const getRolesOptions = (currentUserRoles?: UserRolesItem[]) => {
  const currentLevel = getEffectiveLevel(currentUserRoles);
  const canManageCapabilities = (currentUserRoles ?? []).some((r) =>
    CAPABILITY_MANAGERS.includes(r)
  );

  const hierarchical = HIERARCHICAL_ROLES.filter(
    (r) => (ROLE_PRIORITY[r] ?? 0) < currentLevel
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
