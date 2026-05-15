import React, { useEffect, useState } from "react";
import css from "./index.module.css";
import Input from "../../components/Input/Input";
import {
  PostCameras201,
  UserRegisterDto,
  UserRolesItem,
  UserUpdateDto,
} from "../../apiV2/a7-service/model";
import Button from "../../components/Button/Button";
import {
  useGetProjects,
  useGetUsersAll,
  usePostCameras,
  usePostUsersRegister,
  usePutUsersUpdate,
} from "../../apiV2/a7-service";
import { defaultApiAxiosParams } from "../../api/helpers";
import { showNotification } from "../../components/ShowNotification";
import Select from "../../components/Select/Select";
import { useQueryClient } from "react-query";
import { useProfile } from "../../auth/auth";
import {
  getEffectiveLevel,
  getRolesOptions,
  getWorkplaceOptions,
} from "./helpers";
import Modal from "../../components/Modal/Modal";
import CameraSetupSlider from "../../components/CameraSetupSlider/CameraSetupSlider";
import { getCameraSetupSteps } from "./cameraSetupSteps";
import { Tabs } from "antd";
import {
  formatFullNameForApi,
  parseFullNameFromApi,
} from "../../lib/utils/fullName";

type UserCreateForm = Omit<UserRegisterDto, "name"> & {
  surname: string;
  firstName: string;
  repeatPassword?: string;
};

type UserUpdateForm = Omit<UserUpdateDto, "name"> & {
  surname?: string;
  firstName?: string;
  repeatPassword?: string;
};

const initialCreateUserValues: UserCreateForm = {
  email: "",
  surname: "",
  firstName: "",
  password: "",
  workplace: []
};

const AdministrationPage = () => {
  const [isCreatePasswordError, setIsCreatePasswordError] = useState(false);
  const [isUpdatePasswordError, setIsUpdatePasswordError] = useState(false);
  const [createFormState, setCreateFormState] = useState<UserCreateForm>(
    initialCreateUserValues
  );
  const [updateFormState, setUpdateFormState] = useState<UserUpdateForm>();
  const [selectedProjectId, setSelectedProjectId] = useState<string>();
  const [cameraData, setCameraData] = useState<PostCameras201 | undefined>();
  const [isInstructionModalOpen, setIsInstructionModalOpen] = useState(false);

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

  const {
    isLoading: isCameraLoading,
    isSuccess: isCameraSuccess,
    data: cameraResponse,
    mutate: createCamera,
  } = usePostCameras({
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

  useEffect(() => {
    if (isCameraSuccess) {
      setCameraData(cameraResponse.data);
      showNotification({
        type: "success",
        message: "Данные для привязки фотоаппарата сгенерированы",
      });
    }
  }, [isCameraSuccess, cameraResponse]);

  const handleCreateClick = () => {
    const validPasswords =
      createFormState.password === createFormState.repeatPassword;
    if (validPasswords) {
      createUser({
        data: {
          name: formatFullNameForApi(
            createFormState.surname,
            createFormState.firstName
          ),
          password: createFormState.password,
          email: createFormState.email,
          roles: createFormState.roles,
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

  const handleGenerateCameraData = () => {
    if (selectedProjectId) {
      createCamera({
        data: {
          projectId: selectedProjectId,
        },
      });
    }
  };

  const handleShowInstruction = () => {
    setIsInstructionModalOpen(true);
  };

  const handleCloseInstruction = () => {
    setIsInstructionModalOpen(false);
  };

  const cameraSetupSteps = cameraData
    ? getCameraSetupSteps(
      cameraData.cameraId,
      cameraData.ftpUsername,
      cameraData.ftpPassword,
      cameraData.pasvUrl
    )
    : [];

  const currentUserLevel = getEffectiveLevel(currentUser?.roles);

  const isSupervisor = (currentUser?.roles ?? []).includes(
    UserRolesItem.supervisor
  );

  const allUsersDataOptions = data?.data
    .filter((item) => {
      const defaultFilter =
        item.id !== currentUser?.id &&
        getEffectiveLevel(item.roles) < currentUserLevel;

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
        defaultActiveKey="camera"
        items={[
          {
            key: "camera",
            label: "Привязка фотоаппарата",
            children: (
              <div className={css.section}>
                <div className={css.sectionTitle}>Привязка фотоаппарата</div>
                <div className={css.form}>
                  {isCameraSuccess ? (
                    <>
                      <div className={css.notificationText}>
                        Фотоаппарат готов к привязке. Пожалуйста, подключите фотоаппарат по инструкции.
                      </div>
                      <Button
                        className={css.btn}
                        onClick={handleShowInstruction}
                      >
                        Настроить фотоаппарат
                      </Button>
                    </>
                  ) : (
                    <>
                      <Select
                        label="Филиал"
                        onChange={(value) => setSelectedProjectId(value as string)}
                        value={selectedProjectId}
                        placeholder="Выберите из списка"
                        disabled={isCameraLoading || isProjectsLoading}
                        loading={isProjectsLoading}
                        options={getWorkplaceOptions(
                          projectsData?.data.projects ?? [],
                          currentUser?.roles,
                          currentUser?.workplace
                        )}
                      />
                      <Button
                        className={css.btn}
                        disabled={isCameraLoading || !selectedProjectId}
                        onClick={handleGenerateCameraData}
                        showSpinner={isCameraLoading}
                      >
                        Сгенерировать данные для привязки
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ),
          },
          {
            key: "create-user",
            label: "Создание пользователя",
            children: (
              <div className={css.section}>
                <div className={css.sectionTitle}>Создание нового пользователя</div>
                <div className={css.form}>
                  <Input
                    label="Имя"
                    onChange={(e) =>
                      setCreateFormState((prev) => ({
                        ...prev,
                        firstName: e.target.value,
                      }))
                    }
                    value={createFormState.firstName}
                    disabled={isLoadingCreateUser}
                    placeholder="Введите имя"
                  />
                  <Input
                    label="Фамилия"
                    onChange={(e) =>
                      setCreateFormState((prev) => ({
                        ...prev,
                        surname: e.target.value,
                      }))
                    }
                    value={createFormState.surname}
                    disabled={isLoadingCreateUser}
                    placeholder="Введите фамилию"
                  />
                  <Input
                    label="E-mail"
                    name="create-user-email"
                    autoComplete="off"
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
                    name="create-user-password"
                    autoComplete="new-password"
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
                    name="create-user-repeat-password"
                    autoComplete="new-password"
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
                      currentUser?.roles,
                      currentUser?.workplace
                    )}
                  />
                  <Select
                    label="Роль"
                    mode="multiple"
                    onChange={(value) =>
                      setCreateFormState((prev) => ({
                        ...prev,
                        roles: value as UserRolesItem[],
                      }))
                    }
                    value={createFormState.roles}
                    placeholder="Выберите одну или несколько ролей"
                    disabled={isLoadingCreateUser}
                    options={getRolesOptions(currentUser?.roles)}
                  />
                  <Button
                    className={css.btn}
                    disabled={
                      isLoadingCreateUser ||
                      isCreatePasswordError ||
                      !createFormState.surname ||
                      !createFormState.firstName ||
                      !createFormState.email ||
                      !createFormState.password ||
                      !createFormState.roles?.length ||
                      !createFormState.workplace
                    }
                    onClick={handleCreateClick}
                    showSpinner={isLoadingCreateUser}
                  >
                    Создать
                  </Button>
                </div>
              </div>
            ),
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
                      currentUser?.roles,
                      currentUser?.workplace
                    )}
                  />
                  <Select
                    label="Роль"
                    mode="multiple"
                    onChange={(value) =>
                      setUpdateFormState((prev) => ({
                        ...prev,
                        roles: value as UserRolesItem[],
                      }))
                    }
                    value={updateFormState?.roles}
                    placeholder="Выберите одну или несколько ролей"
                    disabled={isLoading || !updateFormState?.id}
                    options={getRolesOptions(currentUser?.roles)}
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
            ),
          },
        ]}
      />

      <Modal
        title="Инструкция по настройке Canon R6"
        open={isInstructionModalOpen}
        onCancel={handleCloseInstruction}
        onOk={handleCloseInstruction}
        withFooter={false}
        width={1000}
      >
        {cameraSetupSteps.length > 0 && (
          <CameraSetupSlider steps={cameraSetupSteps} />
        )}
      </Modal>
    </div>
  );
};

export default AdministrationPage;
