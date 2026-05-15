import { useCallback, useMemo } from "react";
import { useProfile } from "./auth";
import { RedirectRoutes, Routes } from "../routes/constants";
import { UserRolesItem } from "../apiV2/a7-service/model";

export function useShowPermissions() {
  const { data: userProfile } = useProfile();

  const userPrivileges = useMemo(() => {
    return userProfile?.roles ?? [];
  }, [userProfile]);

  const getRoutePrivileges = useCallback(
    (route: Routes | RedirectRoutes): UserRolesItem[] => {
      return route.roles;
    },
    []
  );

  const hasPrivileges = useCallback(
    (required: UserRolesItem | UserRolesItem[]) => {
      // вариант 1 - прав не нужно
      const emptyList = Array.isArray(required) && required.length === 0;

      if (!required || emptyList) {
        return true;
      }

      // вариант 2 - прав у пользователя нет
      if (!userPrivileges.length) {
        return false;
      }

      // вариант 3 - требуются несколько прав
      if (Array.isArray(required)) {
        return required.some((item: UserRolesItem | UserRolesItem[]) => {
          if (typeof item === "string") {
            return userPrivileges.includes(item);
          }
          if (Array.isArray(item)) {
            return item.every((subItem) => userPrivileges.includes(subItem));
          }

          return false;
        });
      }

      // вариант 4 - требуется конкретное право
      return userPrivileges.includes(required);
    },
    [userPrivileges]
  );

  return useMemo(
    () => ({
      getRoutePrivileges,
      hasPrivileges,
    }),
    [getRoutePrivileges, hasPrivileges, userPrivileges, userProfile]
  );
}
