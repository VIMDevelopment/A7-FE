import React, { useEffect, useRef, useState } from "react";
import { UserOutlined, LogoutOutlined, MenuOutlined } from "@ant-design/icons";
import css from "./index.module.css";
import { useProfile } from "../../auth/auth";
import { getMenuItems, getRoleDescription } from "./helpers";
import SideMenuItem from "./components/SideMenuItem/SideMenuItem";
import Cookies from "js-cookie";
import { useMediaQuery } from "react-responsive";
import cn from "classnames";

const SideMenu = () => {
  const { data: user } = useProfile();
  const isMobile = useMediaQuery({ maxWidth: 768 });

  const [open, setOpen] = useState(false);
  const [userPopoverOpen, setUserPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const avatarRef = useRef<HTMLButtonElement | null>(null);

  const handleLogout = () => {
    Cookies.remove("accessToken");
    window.location.reload();
  };

  const toggleOpen = () => {
    setOpen((prev) => !prev);
  };

  const toggleUserPopover = () => {
    setUserPopoverOpen((prev) => !prev);
  };

  const menuItems = getMenuItems();

  useEffect(() => {
    if (open && isMobile) {
      const scrollBarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    } else {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [open, isMobile]);

  useEffect(() => {
    if (!userPopoverOpen) return;

    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        avatarRef.current &&
        !avatarRef.current.contains(target)
      ) {
        setUserPopoverOpen(false);
      }
    };

    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [userPopoverOpen]);

  const userInitial = (user?.name || user?.email || "?").charAt(0).toUpperCase();

  return (
    <div className={css.container}>
      <aside className={css.rail}>
        <div className={css.brand} title="WanmaX">
          <img src="/images/logo.png" alt="WanmaX" className={css.brandLogo} />
        </div>

        {isMobile && (
          <button
            type="button"
            className={css.railBtn}
            onClick={toggleOpen}
            aria-label="Меню"
          >
            <MenuOutlined style={{ fontSize: 20 }} />
          </button>
        )}

        <div className={css.railSpacer} />

        <div className={css.avatarWrapper}>
          <button
            ref={avatarRef}
            type="button"
            className={css.avatarBtn}
            onClick={toggleUserPopover}
            aria-label="Профиль"
          >
            {userInitial}
          </button>

          {userPopoverOpen && (
            <div ref={popoverRef} className={css.userPopover}>
              <div className={css.userPopoverHeader}>
                <div className={css.userPopoverAvatar}>
                  <UserOutlined style={{ fontSize: 18 }} />
                </div>
                <div className={css.userPopoverInfo}>
                  <div className={css.userPopoverName}>
                    {user?.name || "—"}
                  </div>
                  <div className={css.userPopoverEmail}>
                    {user?.email || ""}
                  </div>
                  <div className={css.userPopoverRole}>
                    {getRoleDescription(user?.role)}
                  </div>
                </div>
              </div>
              <div className={css.userPopoverDivider} />
              <button
                type="button"
                className={css.logoutBtn}
                onClick={handleLogout}
              >
                <LogoutOutlined />
                <span>Выйти</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {isMobile && (
        <div
          className={cn(css.overlay, open && css.open)}
          onClick={toggleOpen}
        />
      )}

      <aside className={cn(css.menu, open && css.open)}>
        <div className={css.menuTitle}>WanmaX</div>
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
      </aside>
    </div>
  );
};

export default SideMenu;
