import React, { useEffect, useState } from "react";
import css from "./index.module.css";
import { LoginRequest } from "../../api/a7-service/model";
import { usePostApiAuthLogin } from "../../api/a7-service";
import { defaultApiAxiosParams } from "../../api/helpers";
import {
  EyeInvisibleOutlined,
  EyeOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { Spin } from "antd";
import Cookies from "js-cookie";
import { PublicRoutes } from "../../routes/routes";
import Input from "../../components/Input/Input";
import Button from "../../components/Button/Button";

const AuthPage = () => {
  const [formState, setFormState] = useState<LoginRequest>({
    email: "",
    password: "",
  });

  const {
    data,
    isLoading,
    isError,
    error,
    mutate: login,
  } = usePostApiAuthLogin({
    axios: defaultApiAxiosParams,
  });

  const handleLoginClick = () => {
    login({
      data: formState,
    });
  };

  useEffect(() => {
    if (data) {
      Cookies.set("accessToken", data?.data?.user?.accessToken ?? "", {});
      window.location.replace(PublicRoutes.MAIN.static);
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
            onKeyDown={(e) => {
              if (e.key === "Enter") handleLoginClick();
            }}
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
            onKeyDown={(e) => {
              if (e.key === "Enter") handleLoginClick();
            }}
            disabled={isLoading}
            placeholder="Введите пароль"
          />
          {isError && (
            <>
              {/* @ts-ignore */}
              <div className={css.error}>{error?.response?.data?.message}</div>
            </>
          )}
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
