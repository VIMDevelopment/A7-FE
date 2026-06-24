import React from "react";
import Cookies from "js-cookie";
import Button from "../../components/Button/Button";
import { PublicRoutes } from "../../routes/routes";
import css from "./index.module.css";

const NoAccessPage: React.FC = () => {
  const handleLogout = () => {
    Cookies.remove("accessToken");
    window.location.replace(PublicRoutes.LOGIN.static);
  };

  return (
    <div className={css.container}>
      <div className={css.modal}>
        <div className={css.title}>Нет доступа к сервису</div>
        <div className={css.description}>
          У вашей учётной записи пока нет ролей и доступа к сервису. Для
          получения доступа обратитесь к руководителю филиала — после
          подтверждения он назначит вам нужные права.
        </div>
        <Button onClick={handleLogout}>Выйти из аккаунта</Button>
      </div>
    </div>
  );
};

export default NoAccessPage;
