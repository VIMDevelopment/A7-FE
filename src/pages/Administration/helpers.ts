import { UserRole } from "../../apiV2/a7-service/model";
import { getRoleDescription } from "../../components/SideMenu/helpers";

export const getRolePriority = (role?: UserRole) => {
  switch (role) {
    case UserRole.admin:
    case UserRole.owner:
      return "5";

    case UserRole.agency:
      return "4";

    case UserRole.cluster:
      return "3";

    case UserRole.supervisor:
      return "2";

    case UserRole.maker:
      return "1";

    default:
      return "";
  }
};

const allRolesOptions = [
  {
    key: UserRole.owner,
    value: UserRole.owner,
    label: getRoleDescription(UserRole.owner),
  },
  {
    key: UserRole.agency,
    value: UserRole.agency,
    label: getRoleDescription(UserRole.agency),
  },
  {
    key: UserRole.cluster,
    value: UserRole.cluster,
    label: getRoleDescription(UserRole.cluster),
  },
  {
    key: UserRole.supervisor,
    value: UserRole.supervisor,
    label: getRoleDescription(UserRole.supervisor),
  },
  {
    key: UserRole.maker,
    value: UserRole.maker,
    label: getRoleDescription(UserRole.maker),
  },
];

export const getRolesOptions = (currentUserRole?: UserRole) => {
  const currentRoleLevel = getRolePriority(currentUserRole);

  return allRolesOptions.filter(
    (item) => getRolePriority(item.value) < currentRoleLevel
  );
};
