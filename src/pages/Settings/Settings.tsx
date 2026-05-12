import React, { useEffect, useState } from "react";
import css from "./index.module.css";
import { defaultApiAxiosParams } from "../../api/helpers";
import { getProfileFx, useProfile } from "../../auth/auth";
import Input from "../../components/Input/Input";
import Button from "../../components/Button/Button";
import { usePutUsersUpdate } from "../../apiV2/a7-service";
import { showNotification } from "../../components/ShowNotification";
import { UserUpdateDto } from "../../apiV2/a7-service/model";
import { useEnterPressListener } from "../../lib/utils/useEnterPressListener";
import {
  formatFullNameForApi,
  parseFullNameFromApi,
} from "../../lib/utils/fullName";

type UserUpdateForm = Omit<UserUpdateDto, "name"> & {
  surname?: string;
  firstName?: string;
  repeatPassword?: string;
};

const SettingsPage = () => {
  const { data: user } = useProfile();
  const [isPasswordError, setIsPasswordError] = useState(false);
  const [formState, setFormState] = useState<UserUpdateForm>(() => {
    const { surname, firstName } = parseFullNameFromApi(user?.name);
    return { surname, firstName };
  });

  const {
    data,
    isLoading,
    isSuccess,
    mutate: update,
  } = usePutUsersUpdate({
    axios: defaultApiAxiosParams,
  });

  useEffect(() => {
    const { surname, firstName } = parseFullNameFromApi(user?.name);
    setFormState((prev) => ({
      ...prev,
      surname,
      firstName,
      email: user?.email,
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
        message: "Данные о пользователе обновлены",
      });
    }
  }, [isSuccess]);

  const handleUpdateClick = () => {
    const validPasswords = formState.password === formState.repeatPassword;
    if (validPasswords) {
      update({
        data: {
          id: user?.id,
          name: formatFullNameForApi(
            formState.surname ?? "",
            formState.firstName ?? ""
          ),
          password: formState.password,
          email: formState.email,
        },
      });
      setIsPasswordError(false);
    } else {
      setIsPasswordError(true);
      showNotification({
        type: "error",
        message: "Пароли не совпадают",
        description:
          "Для обновления пароля нужно ввести одинаковые пароли в оба поля",
      });
    }
  };

  useEnterPressListener(handleUpdateClick);

  return (
    <div className={css.container}>
      <div className={css.pageTitle}>Настройки профиля</div>
      <div className={css.form}>
        <Input
          label="Имя"
          onChange={(e) =>
            setFormState((prev) => ({
              ...prev,
              firstName: e.target.value,
            }))
          }
          value={formState.firstName}
          disabled={isLoading}
          placeholder="Введите имя"
        />
        <Input
          label="Фамилия"
          onChange={(e) =>
            setFormState((prev) => ({
              ...prev,
              surname: e.target.value,
            }))
          }
          value={formState.surname}
          disabled={isLoading}
          placeholder="Введите фамилию"
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
          placeholder="Введите новый пароль"
          status={isPasswordError ? "error" : ""}
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
          placeholder="Повторно введите новый пароль"
          status={isPasswordError ? "error" : ""}
        />
        <Input
          label="Новый e-mail (при изменения почты вы будете автоматически разлогинены из системы)"
          onChange={(e) =>
            setFormState((prev) => ({
              ...prev,
              email: e.target.value,
            }))
          }
          value={formState.email}
          disabled={isLoading}
          placeholder="Введите новый E-mail"
          type="email"
        />
        <Button
          className={css.btn}
          disabled={
            isLoading ||
            isPasswordError ||
            (!formatFullNameForApi(
              formState.surname ?? "",
              formState.firstName ?? ""
            ) &&
              !formState.password)
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
