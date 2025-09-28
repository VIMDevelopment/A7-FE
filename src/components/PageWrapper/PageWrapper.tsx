import React, { FC, PropsWithChildren } from "react";
import css from "./index.module.css";

const PageWrapper: FC<PropsWithChildren> = ({ children }) => {
  return <div className={css.container}>{children}</div>;
};

export default PageWrapper;
