import React, { useEffect, useState } from "react";
import css from "./index.module.css";
import Input from "../../components/Input/Input";
import {
  UserRegisterDto,
  UserRegisterDtoRole,
  UserUpdateDto,
  UserUpdateDtoRole,
} from "../../apiV2/a7-service/model";
import Button from "../../components/Button/Button";
import {
  useGetUsersAll,
  usePostUsersRegister,
  usePutUsersUpdate,
} from "../../apiV2/a7-service";
import { defaultApiAxiosParams } from "../../api/helpers";
import { showNotification } from "../../components/ShowNotification";
import Select from "../../components/Select/Select";
import { useQueryClient } from "react-query";
import { useProfile } from "../../auth/auth";
import { getRolesOptions } from "./helpers";

type UserCreateForm = UserRegisterDto & {
  repeatPassword?: string;
};

const initialCreateUserValues = {
  email: "",
  name: "",
  password: "",
  role: UserRegisterDtoRole.maker,
};

const AdministrationPage = () => {
  const { data: user } = useProfile();
  const [isPasswordError, setIsPasswordError] = useState(false);
  const [createFormState, setCreateFormState] = useState<UserCreateForm>(
    initialCreateUserValues
  );
  const [updateFormState, setUpdateFormState] = useState<UserUpdateDto>();
  const queryClient = useQueryClient();

  const {
    isLoading: isLoadingCreateUser,
    isSuccess: isUserSuccessfulyCreated,
    mutate: createUser,
  } = usePostUsersRegister({
    axios: defaultApiAxiosParams,
  });

  const {
    isLoading,
    isSuccess,
    mutate: updateUser,
  } = usePutUsersUpdate({
    axios: defaultApiAxiosParams,
  });

  const { data } = useGetUsersAll({
    axios: defaultApiAxiosParams,
  });

  useEffect(() => {
    if (isUserSuccessfulyCreated) {
      showNotification({
        type: "success",
        message: "Пользователь создан",
      });
      void queryClient.invalidateQueries({
        queryKey: `/users/all`,
      });
      setCreateFormState(initialCreateUserValues);
    }
  }, [isUserSuccessfulyCreated]);

  useEffect(() => {
    if (isSuccess) {
      showNotification({
        type: "success",
        message: "Данные о пользователе обновлены",
      });
      void queryClient.invalidateQueries({
        queryKey: `/users/all`,
      });
      setUpdateFormState(undefined);
    }
  }, [isSuccess]);

  const handleCreateClick = () => {
    const validPasswords =
      createFormState.password === createFormState.repeatPassword;
    if (validPasswords) {
      createUser({
        data: {
          name: createFormState.name,
          password: createFormState.password,
          email: createFormState.email,
          role: createFormState.role,
        },
      });
      setIsPasswordError(false);
    } else {
      setIsPasswordError(true);
      showNotification({
        type: "error",
        message: "Пароли не совпадают",
        description:
          "Для создания нового пользователя нужно ввести одинаковые пароли в оба поля",
      });
    }
  };

  const handleUpdateClick = () => {
    updateUser({
      data: {
        id: updateFormState?.id,
        name: updateFormState?.name,
        email: updateFormState?.email,
        role: updateFormState?.role,
      },
    });
  };

  const allUsersDataOptions = data?.data
    .filter((item) => item.id !== user?.id)
    .map((item) => ({
      key: item.id,
      value: item.id,
      label: item.name,
    }));

  return (
    <div className={css.container}>
      <div className={css.pageTitle}>Администрирование</div>
      <div className={css.subTitle}>Создание нового пользователя</div>
      <div className={css.form}>
        <Input
          label="Имя"
          onChange={(e) =>
            setCreateFormState((prev) => ({
              ...prev,
              name: e.target.value,
            }))
          }
          value={createFormState.name}
          disabled={isLoadingCreateUser}
          placeholder="Введите имя"
        />
        <Input
          label="E-mail"
          onChange={(e) =>
            setCreateFormState((prev) => ({
              ...prev,
              email: e.target.value,
            }))
          }
          value={createFormState.email}
          disabled={isLoadingCreateUser}
          placeholder="Введите новый E-mail"
          type="email"
        />
        <Input
          label="Пароль"
          isPasswordInput
          onChange={(e) => {
            setCreateFormState((prev) => ({
              ...prev,
              password: e.target.value,
            }));
            setIsPasswordError(false);
          }}
          value={createFormState.password}
          disabled={isLoading}
          placeholder="Введите пароль"
        />
        <Input
          label="Подтвердите пароль"
          isPasswordInput
          onChange={(e) => {
            setCreateFormState((prev) => ({
              ...prev,
              repeatPassword: e.target.value,
            }));
            setIsPasswordError(false);
          }}
          value={createFormState.repeatPassword}
          disabled={isLoading}
          placeholder="Повторно введите пароль"
        />
        <Select
          label="Роль"
          onChange={(value) =>
            setCreateFormState((prev) => ({
              ...prev,
              role: value,
            }))
          }
          value={createFormState.role}
          placeholder="Выберите из списка"
          disabled={isLoadingCreateUser}
          options={getRolesOptions(user?.role)}
        />
        <Button
          className={css.btn}
          disabled={
            isLoadingCreateUser ||
            isPasswordError ||
            !createFormState.name ||
            !createFormState.email ||
            !createFormState.password
          }
          onClick={handleCreateClick}
          showSpinner={isLoadingCreateUser}
        >
          Создать
        </Button>
      </div>

      <div className={css.subTitle}>
        Редактирование существующего пользователя
      </div>
      <div className={css.form}>
        <Select
          label="Выберите пользователя, которого хотите отредактировать"
          placeholder="Выберите из списка"
          onChange={(value) => {
            const selectedUser = data?.data.find((item) => item.id === value);
            setUpdateFormState({
              id: selectedUser?.id,
              name: selectedUser?.name,
              email: selectedUser?.email,
              role: selectedUser?.role as UserUpdateDtoRole,
            });
          }}
          value={updateFormState?.id}
          options={allUsersDataOptions}
        />
        <Input
          label="Новое имя пользователя"
          onChange={(e) =>
            setUpdateFormState((prev) => ({
              ...prev,
              name: e.target.value,
            }))
          }
          value={updateFormState?.name}
          disabled={isLoading || !updateFormState?.id}
          placeholder="Введите имя"
        />
        <Input
          label="Новый e-mail"
          onChange={(e) =>
            setUpdateFormState((prev) => ({
              ...prev,
              email: e.target.value,
            }))
          }
          value={updateFormState?.email}
          disabled={isLoading || !updateFormState?.id}
          placeholder="Введите новый E-mail"
          type="email"
        />
        <Select
          label="Новая роль"
          onChange={(value) =>
            setUpdateFormState((prev) => ({
              ...prev,
              role: value,
            }))
          }
          value={updateFormState?.role}
          placeholder="Выберите из списка"
          disabled={isLoading || !updateFormState?.id}
          options={getRolesOptions(user?.role)}
        />
        <Button
          className={css.btn}
          disabled={isLoading}
          onClick={handleUpdateClick}
          showSpinner={isLoading}
        >
          Сохранить
        </Button>
      </div>
    </div>
  );
};

export default AdministrationPage;
