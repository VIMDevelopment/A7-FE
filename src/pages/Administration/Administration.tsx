import React, { useEffect, useState } from "react";
import cn from "classnames";
import css from "./index.module.css";
import Input from "../../components/Input/Input";
import {
  UserRolesItem,
  UserUpdateDto,
} from "../../apiV2/a7-service/model";
import Button from "../../components/Button/Button";
import {
  useDeleteUsersDelete,
  useGetProjects,
  useGetUsersAll,
  usePutUsersUpdate,
} from "../../apiV2/a7-service";
import { defaultApiAxiosParams } from "../../api/helpers";
import { showNotification } from "../../components/ShowNotification";
import Select from "../../components/Select/Select";
import { useQueryClient } from "react-query";
import { useProfile } from "../../auth/auth";
import {
  applyRolesSelection,
  canEditUser,
  isSuperadmin,
  getRolesOptions,
  getWorkplaceOptions,
} from "./helpers";
import { AllBranchesNote, SuperadminRolesHint } from "./SuperadminNotes";
import Modal from "../../components/Modal/Modal";
import { Tabs } from "antd";
import {
  formatFullNameForApi,
  parseFullNameFromApi,
} from "../../lib/utils/fullName";
import PendingUsersTab from "./PendingUsersTab";

type UserUpdateForm = Omit<UserUpdateDto, "name"> & {
  surname?: string;
  firstName?: string;
  repeatPassword?: string;
};

const AdministrationPage = () => {
  const [isUpdatePasswordError, setIsUpdatePasswordError] = useState(false);
  const [updateFormState, setUpdateFormState] = useState<UserUpdateForm>();
  const [deleteSelectedUserId, setDeleteSelectedUserId] = useState<string>();
  const [userToDelete, setUserToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");

  const { data: currentUser } = useProfile();
  const queryClient = useQueryClient();

  const { data: projectsData, isLoading: isProjectsLoading } = useGetProjects({
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

  const {
    isLoading: isDeleteLoading,
    mutateAsync: deleteUser,
  } = useDeleteUsersDelete({
    axios: defaultApiAxiosParams,
  });

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

  const handleUpdateClick = () => {
    const validPasswords =
      updateFormState?.password === updateFormState?.repeatPassword;
    if (validPasswords) {
      updateUser({
        data: {
          id: updateFormState?.id,
          name: formatFullNameForApi(
            updateFormState?.surname ?? "",
            updateFormState?.firstName ?? ""
          ),
          email: updateFormState?.email,
          password: updateFormState?.password,
          roles: updateFormState?.roles,
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

  const handleOpenDeleteModal = () => {
    const selectedUser = data?.data.find(
      (item) => item.id === deleteSelectedUserId
    );
    if (!selectedUser?.id || !selectedUser.name) return;

    setUserToDelete({ id: selectedUser.id, name: selectedUser.name });
    setDeleteConfirmName("");
  };

  const handleCloseDeleteModal = () => {
    setUserToDelete(null);
    setDeleteConfirmName("");
  };

  const isDeleteConfirmValid =
    userToDelete !== null &&
    deleteConfirmName.trim() === userToDelete.name.trim();

  const handleDeleteOk = async () => {
    if (!userToDelete || !isDeleteConfirmValid) return;

    try {
      await deleteUser({ data: { id: userToDelete.id } });
      showNotification({
        type: "success",
        message: "Пользователь удалён",
      });
      handleCloseDeleteModal();
      setDeleteSelectedUserId(undefined);
      void queryClient.invalidateQueries({
        queryKey: `/users/all`,
      });
    } catch {
      // ошибка показывается через глобальный onError в QueryClient
    }
  };

  const isSupervisor = (currentUser?.roles ?? []).includes(
    UserRolesItem.supervisor
  );

  const allUsersDataOptions = data?.data
    .filter((item) => {
      const defaultFilter =
        item.id !== currentUser?.id && canEditUser(currentUser?.roles, item.roles);

      if (isSupervisor) {
        return (
          defaultFilter &&
          currentUser?.workplace?.some((el) => item.workplace?.includes(el))
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

      <Tabs
        className={css.tabs}
        defaultActiveKey="pending-users"
        items={[
          {
            key: "pending-users",
            label: "Ожидают доступа",
            children: <PendingUsersTab />,
          },
          {
            key: "update-user",
            label: "Редактирование пользователя",
            children: (
              <div className={css.section}>
                <div className={css.sectionTitle}>
                  Редактирование существующего пользователя
                </div>
                <div className={css.form}>
                  <Select
                    searchable
                    label="Выберите пользователя, которого хотите отредактировать"
                    placeholder="Выберите из списка"
                    onChange={(value) => {
                      const selectedUser = data?.data.find((item) => item.id === value);
                      const projectsIds = projectsData?.data.projects?.map((el) => el.id);
                      const { surname, firstName } = parseFullNameFromApi(
                        selectedUser?.name
                      );

                      setUpdateFormState({
                        id: selectedUser?.id,
                        surname,
                        firstName,
                        email: selectedUser?.email,
                        roles: selectedUser?.roles ?? [],
                        workplace: selectedUser?.workplace?.filter((item) =>
                          projectsIds?.includes(item)
                        ),
                      });
                    }}
                    value={updateFormState?.id}
                    options={allUsersDataOptions}
                  />
                  <Input
                    label="Имя"
                    onChange={(e) =>
                      setUpdateFormState((prev) => ({
                        ...prev,
                        firstName: e.target.value,
                      }))
                    }
                    value={updateFormState?.firstName}
                    disabled={isLoading || !updateFormState?.id}
                    placeholder="Введите имя"
                  />
                  <Input
                    label="Фамилия"
                    onChange={(e) =>
                      setUpdateFormState((prev) => ({
                        ...prev,
                        surname: e.target.value,
                      }))
                    }
                    value={updateFormState?.surname}
                    disabled={isLoading || !updateFormState?.id}
                    placeholder="Введите фамилию"
                  />
                  <Input
                    label="Новый e-mail"
                    name="update-user-email"
                    autoComplete="off"
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
                    name="update-user-password"
                    autoComplete="new-password"
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
                    name="update-user-repeat-password"
                    autoComplete="new-password"
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
                  {isSuperadmin(updateFormState?.roles) ? (
                    <AllBranchesNote label="Место работы / доступные филиалы" />
                  ) : (
                    <Select
                      label="Место работы / доступные филиалы"
                      onChange={(value) =>
                        setUpdateFormState((prev) => ({
                          ...prev,
                          workplace: value,
                        }))
                      }
                      mode="multiple"
                      showSelectAll
                      value={updateFormState?.workplace}
                      placeholder="Выберите из списка"
                      disabled={
                        isLoading || isProjectsLoading || !updateFormState?.id
                      }
                      loading={isProjectsLoading}
                      options={getWorkplaceOptions(
                        projectsData?.data.projects ?? [],
                        currentUser?.roles,
                        currentUser?.workplace
                      )}
                    />
                  )}
                  <Select
                    label="Роль"
                    mode="multiple"
                    onChange={(value) =>
                      setUpdateFormState((prev) => ({
                        ...prev,
                        roles: applyRolesSelection(
                          prev?.roles ?? [],
                          value as UserRolesItem[]
                        ),
                      }))
                    }
                    value={updateFormState?.roles}
                    placeholder="Выберите одну или несколько ролей"
                    disabled={isLoading || !updateFormState?.id}
                    options={getRolesOptions(currentUser?.roles)}
                  />
                  {isSuperadmin(updateFormState?.roles) && <SuperadminRolesHint />}
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
            ),
          },
          {
            key: "delete-user",
            label: "Удаление пользователя",
            children: (
              <div className={css.section}>
                <div className={css.sectionTitle}>Удаление пользователя</div>
                <div className={css.form}>
                  <Select
                    searchable
                    label="Выберите пользователя, которого хотите удалить"
                    placeholder="Выберите из списка"
                    onChange={(value) => setDeleteSelectedUserId(value as string)}
                    value={deleteSelectedUserId}
                    options={allUsersDataOptions}
                  />
                  <Button
                    className={cn(css.btn, css.deleteButton)}
                    disabled={!deleteSelectedUserId || isDeleteLoading}
                    onClick={handleOpenDeleteModal}
                  >
                    Удалить
                  </Button>
                </div>
              </div>
            ),
          },
        ]}
      />

      <Modal
        title="Удаление пользователя"
        open={userToDelete !== null}
        onOk={handleDeleteOk}
        onCancel={handleCloseDeleteModal}
        okButtonName="Удалить"
        destroyOnClose
        isLoading={isDeleteLoading}
        okButtonDisabled={!isDeleteConfirmValid}
        customOkButtonClassName={css.deleteButton}
      >
        {userToDelete && (
          <div className={css.deleteModalContent}>
            <p className={css.deleteModalText}>
              Вы уверены, что хотите удалить пользователя «{userToDelete.name}»?
              Это действие необратимо.
            </p>
            <p className={css.deleteModalHint}>
              Для подтверждения введите ФИО пользователя точно так, как в списке:{" "}
              <strong>{userToDelete.name}</strong>
            </p>
            <Input
              label="ФИО пользователя"
              value={deleteConfirmName}
              onChange={(e) => setDeleteConfirmName(e.target.value)}
              disabled={isDeleteLoading}
              placeholder="Введите ФИО пользователя"
              status={
                deleteConfirmName && !isDeleteConfirmValid ? "error" : ""
              }
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdministrationPage;
