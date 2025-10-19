import React, { useEffect, useState } from "react";
import { UserOutlined, LogoutOutlined, MenuOutlined } from "@ant-design/icons";
import css from "./index.module.css";
import { useProfile } from "../../auth/auth";
import { getMenuItems, getRoleDescription } from "./helpers";
import SideMenuItem from "./components/SideMenuItem/SideMenuItem";
import Cookies from "js-cookie";
import { Tooltip } from "antd";
import { useMediaQuery } from "react-responsive";

const SideMenu = () => {
  const { data: user } = useProfile();
  const isMobile = useMediaQuery({ maxWidth: 768 });

  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    Cookies.remove("accessToken");
    window.location.reload();
  };

  const toggleOpen = () => {
    setOpen((prev) => !prev);
  };

  const menuItems = getMenuItems({
    isMobileMenu: isMobile,
    onLogout: handleLogout,
  });

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
          {!isMobile && (
            <Tooltip title="Выйти из аккаунта">
              <LogoutOutlined
                style={{ color: "white", opacity: "0.5" }}
                onClick={handleLogout}
              />
            </Tooltip>
          )}
          {isMobile && (
            <MenuOutlined
              style={{ color: "white", opacity: "0.5", fontSize: "40px" }}
              onClick={toggleOpen}
            />
          )}
        </div>
      </div>
      {(!isMobile || open) && (
        <div className={css.menuItemsContainer}>
          {menuItems.map((item, index) => (
            <SideMenuItem
              key={`${item.title}${index}`}
              icon={item.icon}
              title={item.title}
              route={item.route}
              toggleOpen={toggleOpen}
              customOnClick={item.customOnClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SideMenu;
