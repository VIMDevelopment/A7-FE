import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import Input from "../../components/Input/Input";
import Button from "../../components/Button/Button";
import { usePostUsersLogin } from "../../apiV2/a7-service";
import { UserLoginDto } from "../../apiV2/a7-service/model";
import { defaultApiAxiosParams } from "../../api/helpers";
import { useEnterPressListener } from "../../lib/utils/useEnterPressListener";
import { PublicRoutes } from "../../routes/routes";
import css from "./index.module.css";

type Props = {
  isActive: boolean;
  onForgotPassword: () => void;
};

const LoginTab: React.FC<Props> = ({ isActive, onForgotPassword }) => {
  const [formState, setFormState] = useState<UserLoginDto>({
    email: "",
    password: "",
  });

  const { data, isLoading, mutate: login } = usePostUsersLogin({
    axios: defaultApiAxiosParams,
  });

  const handleLoginClick = () => {
    if (!formState.email || !formState.password) return;
    login({ data: formState });
  };

  useEnterPressListener(isActive ? handleLoginClick : () => undefined);

  useEffect(() => {
    if (data) {
      Cookies.set("accessToken", data.data.jwt ?? "", {});
      window.location.replace(PublicRoutes.PROJECTS.static);
    }
  }, [data]);

  return (
    <div className={css.form}>
      <Input
        label="E-mail"
        onChange={(e) =>
          setFormState((prev) => ({ ...prev, email: e.target.value }))
        }
        value={formState.email}
        disabled={isLoading}
        placeholder="Введите E-mail"
        type="email"
      />
      <Input
        label="Пароль"
        isPasswordInput
        onChange={(e) =>
          setFormState((prev) => ({ ...prev, password: e.target.value }))
        }
        value={formState.password}
        disabled={isLoading}
        placeholder="Введите пароль"
      />
      <Button
        disabled={isLoading || !formState.email || !formState.password}
        onClick={handleLoginClick}
        showSpinner={isLoading}
      >
        Войти
      </Button>
      <div className={css.forgotRow}>
        <Button type="link" onClick={onForgotPassword} disabled={isLoading}>
          Забыли пароль?
        </Button>
      </div>
    </div>
  );
};

export default LoginTab;
