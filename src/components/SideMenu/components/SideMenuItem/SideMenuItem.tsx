import React, { FC, ReactNode, useState } from "react";
import css from "./index.module.css";
import { useNavigate } from "react-router-dom";
import { useShowPermissions } from "../../../../auth/userData";
import { UserRole } from "../../../../api/a7-service/model";
import { ROUTES } from "../../../../routes/constants";

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

  return (
    <>
      {showItem && (
        <div className={css.container} onClick={handleClick}>
          <div className={css.iconContainer}>{icon}</div>
          <div className={css.itemTitle}>{title}</div>
        </div>
      )}
    </>
  );
};

export default SideMenuItem;
