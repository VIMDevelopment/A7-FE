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
};

const SideMenuItem: FC<SideMenuItemProps> = ({ icon, title, route }) => {
  let showItem = false;

  const { getRoutePrivileges, hasPrivileges } = useShowPermissions();
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(route);
  };

  const routeObject = ROUTES.find((item) => item.path === route);

  if (routeObject) {
    showItem = hasPrivileges(getRoutePrivileges(routeObject))
  }

  return (
    <>
      {showItem ? (
        <div className={css.container} onClick={handleClick}>
          <div className={css.iconContainer}>{icon}</div>
          <div className={css.itemTitle}>{title}</div>
        </div>
      ) : null}
    </>
  );
};

export default SideMenuItem;
