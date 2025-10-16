import React, { useEffect, useMemo, useState } from "react";
import css from "./index.module.css";
import { Breadcrumb } from "antd";
import { useNavigate, useParams, Link } from "react-router-dom";
import { PublicRoutes } from "../../routes/routes";
import {
  useDeleteAlbumsId,
  useGetAlbumsId,
  useGetAlbumsProjectProjectId,
  useGetPhotosAlbumAlbumId,
  useGetProjects,
  usePutAlbumsId,
} from "../../apiV2/a7-service";
import { defaultApiAxiosParams } from "../../api/helpers";
import UploadBox from "./components/UploadBox/UploadBox";
import PhotoCard from "./components/PhotoCard/PhotoCard";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import Modal from "../../components/Modal/Modal";
import Input from "../../components/Input/Input";
import { showNotification } from "../../components/ShowNotification";
import { useQueryClient } from "react-query";
import { Image } from "antd";

const AlbumPage = () => {
  const { projectId, albumId } = useParams();
  const navigate = useNavigate();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const queryClient = useQueryClient();

  const { data: allProjectsData } = useGetProjects({
    axios: defaultApiAxiosParams,
  });

  const { data: albumData } = useGetAlbumsId(albumId ?? "", {
    axios: defaultApiAxiosParams,
  });

  const { data: albumPhotosData } = useGetPhotosAlbumAlbumId(albumId ?? "", {
    axios: defaultApiAxiosParams,
  });

  const { data: albumsData } = useGetAlbumsProjectProjectId(projectId ?? "", {
    axios: defaultApiAxiosParams,
  });

  const allAlbumsNames =
    albumsData?.data?.map((item) => item.title ?? "") ?? [];

  const {
    isLoading: isEditLoading,
    isSuccess: isEditSuccess,
    mutate: updateAlbum,
  } = usePutAlbumsId({
    axios: defaultApiAxiosParams,
  });

  const {
    isLoading: isDeleteLoading,
    isSuccess: isDeleteSuccess,
    mutate: deleteAlbum,
  } = useDeleteAlbumsId({
    axios: defaultApiAxiosParams,
  });

  useEffect(() => {
    setInputValue(albumData?.data?.title ?? "");
  }, [albumData]);

  useEffect(() => {
    if (isEditSuccess) {
      showNotification({
        message: "Альбом успешно переименован",
        type: "success",
      });
      setIsEditModalOpen(false);
      void queryClient.invalidateQueries({ queryKey: `/albums/${albumId}` });
      void queryClient.invalidateQueries({
        queryKey: `/albums/project/${projectId}`,
      });
    }
  }, [isEditSuccess]);

  useEffect(() => {
    if (isDeleteSuccess) {
      showNotification({
        message: "Альбом успешно удален",
        type: "success",
      });
      setIsDeleteModalOpen(false);
      void queryClient.invalidateQueries({
        queryKey: `/albums/project/${projectId}`,
      });
      navigate(PublicRoutes.PROJECT.get({ projectId: projectId ?? "" }));
    }
  }, [isDeleteSuccess]);

  const projectName = useMemo(
    () =>
      allProjectsData?.data?.projects?.find((item) => item.id === projectId)
        ?.name,
    [allProjectsData]
  );

  const albumPhotos = useMemo(
    () =>
      albumPhotosData?.data?.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateA - dateB;
      }),
    [albumPhotosData]
  );

  const handleProjectsClick = () => {
    navigate(PublicRoutes.PROJECTS.static);
  };

  const handleEditClick = () => {
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleEditOk = () => {
    const isNameUniq = !allAlbumsNames.some(
      (item) => item.toLocaleLowerCase() === inputValue.toLocaleLowerCase()
    );

    if (isNameUniq) {
      updateAlbum({
        id: albumId ?? "",
        data: {
          title: inputValue,
        },
      });
    } else {
      showNotification({
        type: "error",
        message:
          "Альбом с таким названием уже существует. Пожалуйста, введите другое название.",
      });
    }
  };

  const handleDeleteOk = () => {
    deleteAlbum({
      id: albumId ?? "",
    });
  };

  const handleEditCancel = () => {
    setIsEditModalOpen(false);
    setInputValue(albumData?.data?.title ?? "");
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
  };

  return (
    <div className={css.container}>
      <div className={css.pageTitle} onClick={handleProjectsClick}>
        Проекты
      </div>
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
              title: (
                <Link
                  to={PublicRoutes.PROJECT.get({ projectId: projectId ?? "" })}
                >
                  Проект: "{projectName ?? ""}"
                </Link>
              ),
            },
            {
              type: "separator",
            },
            {
              title: `Альбом: "${albumData?.data?.title ?? ""}"`,
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
      {albumPhotos?.length === 0 ? (
        <UploadBox size="big" albumId={albumId ?? ""} />
      ) : (
        <div className={css.grid}>
          <Image.PreviewGroup items={albumPhotos?.map((item) => item.fileUrl)}>
            {albumPhotos?.map((item) => (
              <PhotoCard
                key={item.id}
                url={item.fileUrl}
                name={item.fileName}
              />
            ))}
          </Image.PreviewGroup>
          <UploadBox size="small" albumId={albumId ?? ""} />
        </div>
      )}
      <Modal
        title={"Редактирование альбома"}
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
        title={"Удаление альбома"}
        open={isDeleteModalOpen}
        onOk={handleDeleteOk}
        onCancel={handleDeleteCancel}
        okButtonName="Удалить"
        destroyOnHidden
        isLoading={isDeleteLoading}
        customOkButtonClassName={css.deleteButton}
      >
        {`Вы уверены, что хотите удалить альбом "${albumData?.data?.title}"? Все данные будут безвозвратно
        удалены.`}
      </Modal>
    </div>
  );
};

export default AlbumPage;
