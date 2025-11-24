import React, { useEffect, useState } from "react";
import css from "./index.module.css";
import { defaultApiAxiosParams } from "../../api/helpers";
import Cookies from "js-cookie";
import { PublicRoutes } from "../../routes/routes";
import Input from "../../components/Input/Input";
import Button from "../../components/Button/Button";
import { usePostUsersLogin } from "../../apiV2/a7-service";
import { useEnterPressListener } from "../../lib/utils/useEnterPressListener";
import { UserLoginDto } from "../../apiV2/a7-service/model";

const AuthPage = () => {
  const [formState, setFormState] = useState<UserLoginDto>({
    email: "",
    password: "",
  });

  const {
    data,
    isLoading,
    mutate: login,
  } = usePostUsersLogin({
    axios: defaultApiAxiosParams,
  });

  const handleLoginClick = () => {
    login({
      data: formState,
    });
  };

  useEnterPressListener(handleLoginClick);

  useEffect(() => {
    if (data) {
      Cookies.set("accessToken", data.data.jwt ?? "", {});
      window.location.replace(PublicRoutes.PROJECTS.static);
    }
  }, [data]);

  return (
    <div className={css.container}>
      <div className={css.modal}>
        <div className={css.title}>Авторизация</div>
        <div className={css.form}>
          <Input
            label="E-mail"
            onChange={(e) =>
              setFormState((prev) => ({
                ...prev,
                email: e.target.value,
              }))
            }
            disabled={isLoading}
            placeholder="Введите E-mail"
            type="email"
          />
          <Input
            label="Пароль"
            isPasswordInput
            onChange={(e) =>
              setFormState((prev) => ({
                ...prev,
                password: e.target.value,
              }))
            }
            disabled={isLoading}
            placeholder="Введите пароль"
          />
          <Button
            disabled={isLoading}
            onClick={handleLoginClick}
            showSpinner={isLoading}
          >
            Войти
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
