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

const AuthPage = () => {
  const [isVisiblePassword, setIsVisiblePassword] = useState(false);
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
          <div className={css.fieldContainer}>
            <div className={css.fieldTitle}>E-mail</div>
            <input
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
              className={css.input}
              placeholder="Введите E-mail"
              type="email"
            />
          </div>
          <div className={css.fieldContainer}>
            <div className={css.fieldTitle}>Пароль</div>
            <div className={css.passwordInputContainer}>
              <input
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
                className={css.input}
                placeholder="Введите пароль"
                type={isVisiblePassword ? "text" : "password"}
              />
              <div className={css.eyeContainer}>
                {!isVisiblePassword ? (
                  <EyeOutlined
                    onClick={() => setIsVisiblePassword((prev) => !prev)}
                  />
                ) : (
                  <EyeInvisibleOutlined
                    onClick={() => setIsVisiblePassword((prev) => !prev)}
                  />
                )}
              </div>
            </div>
          </div>
          {isError && (
            <>
              {/* @ts-ignore */}
              <div className={css.error}>{error?.response?.data?.message}</div>
            </>
          )}
          <button
            disabled={isLoading}
            className={css.btn}
            onClick={handleLoginClick}
          >
            Войти &nbsp;
            {isLoading && (
              <Spin
                indicator={<LoadingOutlined spin style={{ color: "white" }} />}
                size="default"
              />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
