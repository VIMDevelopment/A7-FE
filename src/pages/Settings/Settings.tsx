import React, { useEffect, useState } from "react";
import css from "./index.module.css";
import { UserRole } from "../../api/a7-service/model";
import { usePutApiUsersId } from "../../api/a7-service";
import { defaultApiAxiosParams } from "../../api/helpers";
import { getProfileFx, useProfile } from "../../auth/auth";
import { LoadingOutlined } from "@ant-design/icons";
import { Option } from "antd/es/mentions";
import Input from "../../components/Input/Input";
import Button from "../../components/Button/Button";
import Select from "../../components/Select/Select";
import { getRoleDescription } from "../../components/SideMenu/helpers";
import { usePutUsersUpdate } from "../../apiV2/a7-service";
import { UserUpdateDto } from "../../apiV2/a7-service/model";
import Cookies from "js-cookie";
import { PublicRoutes } from "../../routes/routes";
import { showNotification } from "../../components/ShowNotification";

type UserUpdateForm = UserUpdateDto & {
  repeatPassword?: string;
};

const SettingsPage = () => {
  const { data: user } = useProfile();
  const [isPasswordError, setIsPasswordError] = useState(false);
  const [formState, setFormState] = useState<UserUpdateForm>({
    name: user?.name,
    password: "",
    repeatPassword: "",
  });

  const {
    data,
    isLoading,
    isError,
    error,
    isSuccess,
    mutate: update,
  } = usePutUsersUpdate({
    axios: defaultApiAxiosParams,
  });

  useEffect(() => {
    setFormState((prev) => ({
      ...prev,
      name: user?.name,
    }));
  }, [user]);

  useEffect(() => {
    if (data) {
      void getProfileFx();
    }
  }, [data]);

  useEffect(() => {
    if (isSuccess) {
      showNotification({
        type: "success",
        message: "Данные о пользователе успешно обновлены",
      });
    }
  }, [isSuccess]);

  const handleUpdateClick = () => {
    const validPasswords = formState.password === formState.repeatPassword;
    if (validPasswords) {
      update({
        data: {
          name: formState.name,
          password: formState.password,
        },
      });
      setIsPasswordError(false);
    } else {
      setIsPasswordError(true);
    }
  };

  return (
    <div className={css.container}>
      <div className={css.pageTitle}>Настройки</div>
      <div className={css.form}>
        <Input
          label="Новое имя пользователя"
          onChange={(e) =>
            setFormState((prev) => ({
              ...prev,
              name: e.target.value,
            }))
          }
          value={formState.name}
          disabled={isLoading}
          placeholder="Имя"
        />
        <Input
          label="Новый пароль"
          isPasswordInput
          onChange={(e) => {
            setFormState((prev) => ({
              ...prev,
              password: e.target.value,
            }));
            setIsPasswordError(false);
          }}
          disabled={isLoading}
          placeholder="Введите пароль"
        />
        <Input
          label="Подтвердите новый пароль"
          isPasswordInput
          onChange={(e) => {
            setFormState((prev) => ({
              ...prev,
              repeatPassword: e.target.value,
            }));
            setIsPasswordError(false);
          }}
          disabled={isLoading}
          placeholder="Повторно введите пароль"
        />
        {/* TODO: вернуть когда доработается метод PUT users/update */}
        {/* <Input
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
        <Select
          label="Роль"
          onChange={(value) =>
            setFormState((prev) => ({
              ...prev,
              role: value,
            }))
          }
          options={[
            {
              key: UserRole.photographer,
              value: UserRole.photographer,
              label: getRoleDescription(UserRole.photographer),
            },
            {
              key: UserRole.seller,
              value: UserRole.seller,
              label: getRoleDescription(UserRole.seller),
            },
            {
              key: UserRole.manager,
              value: UserRole.manager,
              label: getRoleDescription(UserRole.manager),
            },
          ]}
        /> */}
        {isPasswordError && (
          <div className={css.error}>Пароли не совпадают</div>
        )}
        <Button
          className={css.btn}
          disabled={
            isLoading ||
            isPasswordError ||
            (!formState.name && !formState.password)
          }
          onClick={handleUpdateClick}
          showSpinner={isLoading}
        >
          Сохранить
        </Button>
      </div>
    </div>
  );
};
export default SettingsPage;
