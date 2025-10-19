import React from "react";
import { UserOutlined, LogoutOutlined } from "@ant-design/icons";
import css from "./index.module.css";
import { useProfile } from "../../auth/auth";
import { getRoleDescription, menuItems } from "./helpers";
import SideMenuItem from "./components/SideMenuItem/SideMenuItem";
import Cookies from "js-cookie";
import { Tooltip } from "antd";

const SideMenu = () => {
  const { data: user } = useProfile();

  const handleLogout = () => {
    Cookies.remove("accessToken");
    window.location.reload();
  };

  return (
    <div className={css.container}>
      <div className={css.profileContainer}>
        <div className={css.avatarContainer}>
          <UserOutlined style={{ fontSize: "30px" }} />
        </div>
        <div className={css.profileInfoCpntainer}>
          <div className={css.userInfoContainer}>
            <div className={css.userName}>{user?.name}</div>
            <div className={css.userRole}>{getRoleDescription(user?.role)}</div>
          </div>
          <Tooltip title="Выйти из аккаунта">
            <LogoutOutlined
              style={{ color: "white", opacity: "0.5" }}
              onClick={handleLogout}
            />
          </Tooltip>
        </div>
      </div>
      <div className={css.menuItemsContainer}>
        {menuItems.map((item, index) => (
          <SideMenuItem
            key={`${item.title}${index}`}
            icon={item.icon}
            title={item.title}
            route={item.route}
          />
        ))}
      </div>
    </div>
  );
};

export default SideMenu;
