import React, { useEffect, useMemo, useState } from "react";
import css from "./index.module.css";
import {
  useDeleteProjectsDelete,
  useGetAlbumsProjectProjectId,
  useGetProjects,
  usePutProjectsUpdate,
} from "../../apiV2/a7-service";
import { defaultApiAxiosParams } from "../../api/helpers";
import { Link, useNavigate, useParams } from "react-router-dom";
import AlbumCard from "./components/AlbumCard/AlbumCard";
import AddAlbumCard from "./components/AddAlbumCard/AddAlbumCard";
import { Breadcrumb } from "antd";
import { PublicRoutes } from "../../routes/routes";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import Modal from "../../components/Modal/Modal";
import Input from "../../components/Input/Input";
import { showNotification } from "../../components/ShowNotification";
import { useQueryClient } from "react-query";

const ProjectPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const queryClient = useQueryClient();

  const { data: allProjectsData } = useGetProjects({
    axios: defaultApiAxiosParams,
  });

  const { data: albumsData } = useGetAlbumsProjectProjectId(projectId ?? "", {
    axios: defaultApiAxiosParams,
  });

  const {
    isLoading: isEditLoading,
    isSuccess: isEditSuccess,
    mutate: updateProject,
  } = usePutProjectsUpdate({
    axios: defaultApiAxiosParams,
  });

  const {
    isLoading: isDeleteLoading,
    isSuccess: isDeleteSuccess,
    mutate: deleteProject,
  } = useDeleteProjectsDelete({
    axios: defaultApiAxiosParams,
  });

  const projectName = useMemo(
    () =>
      allProjectsData?.data?.projects?.find((item) => item.id === projectId)
        ?.name,
    [allProjectsData]
  );

  const allProjectsNames =
    allProjectsData?.data?.projects?.map((item) => item.name ?? "") ?? [];

  useEffect(() => {
    setInputValue(projectName ?? "");
  }, [projectName]);

  useEffect(() => {
    if (isEditSuccess) {
      showNotification({
        message: "Проект переименован",
        type: "success",
      });
      setIsEditModalOpen(false);
      void queryClient.invalidateQueries({ queryKey: "/projects" });
    }
  }, [isEditSuccess]);

  useEffect(() => {
    if (isDeleteSuccess) {
      showNotification({
        message: "Проект удален",
        type: "success",
      });
      setIsDeleteModalOpen(false);
      void queryClient.invalidateQueries({ queryKey: "/projects" });
      navigate(PublicRoutes.PROJECTS.static);
    }
  }, [isDeleteSuccess]);

  const handleEditClick = () => {
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleEditOk = () => {
    const isNameUniq = !allProjectsNames.some(
      (item) => item.toLocaleLowerCase() === inputValue.toLocaleLowerCase()
    );

    if (isNameUniq) {
      updateProject({
        data: {
          id: projectId ?? "",
          name: inputValue,
        },
      });
    } else {
      showNotification({
        type: "error",
        message:
          "Проект с таким названием уже существует. Пожалуйста, введите другое название.",
      });
    }
  };

  const handleDeleteOk = () => {
    deleteProject({
      data: {
        id: projectId ?? "",
      },
    });
  };

  const handleEditCancel = () => {
    setIsEditModalOpen(false);
    setInputValue(projectName ?? "");
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
  };

  const allAlbumsNames =
    albumsData?.data?.map((item) => item.title ?? "") ?? [];

  return (
    <div className={css.container}>
      <div className={css.pageTitle}>Проекты</div>
      <div className={css.navMenu}>
        <Breadcrumb
          className={css.breadCrumbs}
          separator=""
          items={[
            {
              title: <Link to={PublicRoutes.PROJECTS.static}>Все проекты</Link>,
            },
            {
              type: "separator",
            },
            {
              title: `Проект: "${projectName ?? ""}"`,
            },
          ]}
        />
        <div className={css.actionsBlock}>
          <div className={css.icon} onClick={handleEditClick}>
            <EditOutlined
              style={{
                color: "rgba(255, 255, 255, 0.5)",
              }}
            />
          </div>
          <div className={css.icon} onClick={handleDeleteClick}>
            <DeleteOutlined
              style={{
                color: "rgba(255, 255, 255, 0.5)",
              }}
            />
          </div>
        </div>
      </div>
      <div className={css.grid}>
        {albumsData?.data?.map((item) => (
          <AlbumCard
            projectId={projectId}
            key={item.id}
            id={item.id}
            name={item.title}
            coverId={item.coverPhotoId}
          />
        ))}
        <AddAlbumCard
          allAlbumsNames={allAlbumsNames}
          projectId={projectId ?? ""}
        />
      </div>
      <Modal
        title={"Редактирование проекта"}
        open={isEditModalOpen}
        onOk={handleEditOk}
        onCancel={handleEditCancel}
        okButtonName="Сохранить"
        destroyOnHidden
        isLoading={isEditLoading}
      >
        <Input
          label="Введите название"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
      </Modal>
      <Modal
        title={"Удаление проекта"}
        open={isDeleteModalOpen}
        onOk={handleDeleteOk}
        onCancel={handleDeleteCancel}
        okButtonName="Удалить"
        destroyOnHidden
        isLoading={isDeleteLoading}
        customOkButtonClassName={css.deleteButton}
      >
        {`Вы уверены, что хотите удалить проект "${projectName}"? Все данные будут безвозвратно
        утеряны.`}
      </Modal>
    </div>
  );
};

export default ProjectPage;
