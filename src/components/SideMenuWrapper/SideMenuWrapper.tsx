import React, { FC, PropsWithChildren } from "react";
import css from "./index.module.css";
import SideMenu from "../SideMenu/SideMenu";

const SideMenuWrapper: FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className={css.container}>
      <SideMenu />
      <div className={css.pageContainer}>{children}</div>
    </div>
  );
};

export default SideMenuWrapper;
