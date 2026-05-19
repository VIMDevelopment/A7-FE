import React, { FC, PropsWithChildren, useEffect } from "react";
import { useLocation } from "react-router-dom";
import css from "./index.module.css";

const PageWrapper: FC<PropsWithChildren> = ({ children }) => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname]);

  return (
    <div className={css.container}>
      <div key={pathname} className={css.pageContent}>
        {children}
      </div>
    </div>
  );
};

export default PageWrapper;
