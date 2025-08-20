import React, { FC, ReactNode } from "react";
import css from "./index.module.css";
import { useNavigate } from "react-router-dom";

type Props = {
  icon: ReactNode;
  title: string;
  route: string;
};

const SideMenuItem: FC<Props> = ({ icon, title, route }) => {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate(route)
  }

  return (
    <div className={css.container} onClick={handleClick}>
      <div className={css.iconContainer}>{icon}</div>
      <div className={css.itemTitle}>{title}</div>
    </div>
  );
};

export default SideMenuItem;
