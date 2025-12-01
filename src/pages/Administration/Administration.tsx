import React, { useEffect, useState } from "react";
import css from "./index.module.css";
import Input from "../../components/Input/Input";
import {
  UserRegisterDto,
  UserRole,
  UserUpdateDto,
  UserUpdateDtoRole,
} from "../../apiV2/a7-service/model";
import Button from "../../components/Button/Button";
import {
  useGetProjects,
  useGetUsersAll,
  usePostUsersRegister,
  usePutUsersUpdate,
} from "../../apiV2/a7-service";
import { defaultApiAxiosParams } from "../../api/helpers";
import { showNotification } from "../../components/ShowNotification";
import Select from "../../components/Select/Select";
import { useQueryClient } from "react-query";
import { useProfile } from "../../auth/auth";
import {
  getRolePriority,
  getRolesOptions,
  getWorkplaceOptions,
} from "./helpers";

type UserCreateForm = UserRegisterDto & {
  repeatPassword?: string;
};

type UserUpdateForm = UserUpdateDto & {
  repeatPassword?: string;
};

const initialCreateUserValues = {
  email: "",
  name: "",
  password: "",
};

const AdministrationPage = () => {
  const [isCreatePasswordError, setIsCreatePasswordError] = useState(false);
  const [isUpdatePasswordError, setIsUpdatePasswordError] = useState(false);
  const [createFormState, setCreateFormState] = useState<UserCreateForm>(
    initialCreateUserValues
  );
  const [updateFormState, setUpdateFormState] = useState<UserUpdateForm>();

  const { data: currentUser } = useProfile();
  const queryClient = useQueryClient();

  const { data: projectsData, isLoading: isProjectsLoading } = useGetProjects({
    axios: defaultApiAxiosParams,
  });

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
          workplace: createFormState.workplace,
        },
      });
      setIsCreatePasswordError(false);
    } else {
      setIsCreatePasswordError(true);
      showNotification({
        type: "error",
        message: "Пароли не совпадают",
        description:
          "Для создания нового пользователя нужно ввести одинаковые пароли в оба поля",
      });
    }
  };

  const handleUpdateClick = () => {
    const validPasswords =
      updateFormState?.password === updateFormState?.repeatPassword;
    if (validPasswords) {
      updateUser({
        data: {
          id: updateFormState?.id,
          name: updateFormState?.name,
          email: updateFormState?.email,
          password: updateFormState?.password,
          role: updateFormState?.role,
          workplace: updateFormState?.workplace,
        },
      });
      setIsUpdatePasswordError(false);
    } else {
      setIsUpdatePasswordError(true);
      showNotification({
        type: "error",
        message: "Пароли не совпадают",
        description:
          "Для обновления пароля пользователя нужно ввести одинаковые пароли в оба поля",
      });
    }
  };

  const currentUserLevel = getRolePriority(currentUser?.role);

  const isSupervisor = currentUser?.role === UserRole.supervisor;

  const allUsersDataOptions = data?.data
    .filter((item) => {
      const defaultFilter =
        item.id !== currentUser?.id &&
        item.role &&
        getRolePriority(item.role as UserRole) < currentUserLevel;

      if (isSupervisor) {
        return (
          defaultFilter &&
          currentUser.workplace?.some((el) => item.workplace?.includes(el))
        );
      }

      return defaultFilter;
    })
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
            setIsCreatePasswordError(false);
          }}
          value={createFormState.password}
          disabled={isLoading}
          placeholder="Введите пароль"
          status={isCreatePasswordError ? "error" : ""}
        />
        <Input
          label="Подтвердите пароль"
          isPasswordInput
          onChange={(e) => {
            setCreateFormState((prev) => ({
              ...prev,
              repeatPassword: e.target.value,
            }));
            setIsCreatePasswordError(false);
          }}
          value={createFormState.repeatPassword}
          disabled={isLoading}
          placeholder="Повторно введите пароль"
          status={isCreatePasswordError ? "error" : ""}
        />
        <Select
          label="Место работы"
          onChange={(value) =>
            setCreateFormState((prev) => ({
              ...prev,
              workplace: value,
            }))
          }
          mode="multiple"
          value={createFormState.workplace}
          placeholder="Выберите из списка"
          disabled={isLoadingCreateUser || isProjectsLoading}
          loading={isProjectsLoading}
          options={getWorkplaceOptions(
            projectsData?.data.projects ?? [],
            currentUser?.role,
            currentUser?.workplace
          )}
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
          options={getRolesOptions(currentUser?.role)}
        />
        <Button
          className={css.btn}
          disabled={
            isLoadingCreateUser ||
            isCreatePasswordError ||
            !createFormState.name ||
            !createFormState.email ||
            !createFormState.password ||
            !createFormState.role ||
            !createFormState.workplace
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
              workplace: selectedUser?.workplace,
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
        <Input
          label="Новый пароль"
          isPasswordInput
          onChange={(e) => {
            setUpdateFormState((prev) => ({
              ...prev,
              password: e.target.value,
            }));
            setIsUpdatePasswordError(false);
          }}
          value={updateFormState?.password}
          disabled={isLoading || !updateFormState?.id}
          placeholder="Введите пароль"
          status={isUpdatePasswordError ? "error" : ""}
        />
        <Input
          label="Подтвердите новый пароль"
          isPasswordInput
          onChange={(e) => {
            setUpdateFormState((prev) => ({
              ...prev,
              repeatPassword: e.target.value,
            }));
            setIsUpdatePasswordError(false);
          }}
          value={updateFormState?.repeatPassword}
          disabled={isLoading || !updateFormState?.id}
          placeholder="Повторно введите пароль"
          status={isUpdatePasswordError ? "error" : ""}
        />
        <Select
          label="Место работы"
          onChange={(value) =>
            setUpdateFormState((prev) => ({
              ...prev,
              workplace: value,
            }))
          }
          mode="multiple"
          value={updateFormState?.workplace}
          placeholder="Выберите из списка"
          disabled={
            isLoadingCreateUser || isProjectsLoading || !updateFormState?.id
          }
          loading={isProjectsLoading}
          options={getWorkplaceOptions(
            projectsData?.data.projects ?? [],
            currentUser?.role,
            currentUser?.workplace
          )}
        />
        <Select
          label="Роль"
          onChange={(value) =>
            setUpdateFormState((prev) => ({
              ...prev,
              role: value,
            }))
          }
          value={updateFormState?.role}
          placeholder="Выберите из списка"
          disabled={isLoading || !updateFormState?.id}
          options={getRolesOptions(currentUser?.role)}
        />
        <Button
          className={css.btn}
          disabled={isLoading || isUpdatePasswordError || !updateFormState?.id}
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
