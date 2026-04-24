import React, { FC, ReactNode } from "react";
import css from "./index.module.css";
import { useLocation, useNavigate } from "react-router-dom";
import { useShowPermissions } from "../../../../auth/userData";
import { ROUTES } from "../../../../routes/constants";
import cn from "classnames";

export type SideMenuItemProps = {
  icon: ReactNode;
  title: string;
  route: string;
  toggleOpen?: () => void;
  customOnClick?: () => void;
};

const SideMenuItem: FC<SideMenuItemProps> = ({
  icon,
  title,
  route,
  toggleOpen,
  customOnClick,
}) => {
  const { getRoutePrivileges, hasPrivileges } = useShowPermissions();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleClick = () => {
    toggleOpen?.();
    if (customOnClick) {
      customOnClick();
    } else {
      navigate(route);
    }
  };

  const routeObject = ROUTES.find((item) => item.path === route);

  const showItem =
    routeObject && hasPrivileges(getRoutePrivileges(routeObject));

  const isActive =
    pathname === route ||
    (route !== "/" && pathname.startsWith(`${route}/`));

  if (!showItem) return null;

  return (
    <div
      className={cn(css.container, isActive && css.active)}
      onClick={handleClick}
    >
      <div className={css.iconContainer}>{icon}</div>
      <div className={css.itemTitle}>{title}</div>
    </div>
  );
};

export default SideMenuItem;
