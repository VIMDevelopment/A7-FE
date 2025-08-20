import React from "react";
import { UserOutlined, LogoutOutlined } from "@ant-design/icons";
import css from "./index.module.css";
import { useProfile } from "../../auth/auth";
import { getRoleDescription } from "./helpers";
import SideMenuItem from "./components/SideMenuItem/SideMenuItem";
import ProjectsIcon from "../../assets/ProjectsIcon";
import ReportsIcon from "../../assets/ReportsIcon";
import StatisticsIcon from "../../assets/StatisticsIcon";
import SettingsIcon from "../../assets/SettingsIcon";
import { PublicRoutes } from "../../routes/routes";

const SideMenu = () => {
  const { data: user } = useProfile();

  return (
    <div className={css.container}>
      <div className={css.profileContainer}>
        <div className={css.avatarContainer}>
          <UserOutlined style={{ fontSize: "30px" }} />
        </div>
        <div className={css.userInfoContainer}>
          <div className={css.userName}>{user?.username}</div>
          <div className={css.userRole}>{getRoleDescription(user?.role)}</div>
        </div>
        <LogoutOutlined
          style={{ opacity: "0.5", paddingTop: "8px" }}
          onClick={() => console.log("logout")}
        />
      </div>
      <div className={css.menuItemsContainer}>
        <SideMenuItem
          icon={<ProjectsIcon />}
          title="Проекты"
          route={PublicRoutes.PROJECTS.static}
        />
        <SideMenuItem
          icon={<ReportsIcon />}
          title="Отчеты"
          route={PublicRoutes.REPORTS.static}
        />
        <SideMenuItem
          icon={<StatisticsIcon />}
          title="Статистика"
          route={PublicRoutes.STATISTICS.static}
        />
        <SideMenuItem
          icon={<SettingsIcon />}
          title="Настройки"
          route={PublicRoutes.SETTINGS.static}
        />
      </div>
    </div>
  );
};

export default SideMenu;
