import React from "react";
import { UserOutlined, LogoutOutlined } from "@ant-design/icons";
import css from "./index.module.css";
import { useProfile } from "../../auth/auth";
import { getRoleDescription, menuItems } from "./helpers";
import SideMenuItem from "./components/SideMenuItem/SideMenuItem";

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
        {menuItems.map((item) => (
          <SideMenuItem
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
