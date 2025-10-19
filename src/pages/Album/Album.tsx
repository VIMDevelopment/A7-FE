import React, { useEffect, useMemo, useState } from "react";
import css from "./index.module.css";
import { Breadcrumb } from "antd";
import { useNavigate, useParams, Link } from "react-router-dom";
import { PublicRoutes } from "../../routes/routes";
import {
  useDeleteAlbumsId,
  useDeletePhotosId,
  useGetAlbumsId,
  useGetAlbumsProjectProjectId,
  useGetPhotosAlbumAlbumId,
  useGetProjects,
  usePutAlbumsCover,
  usePutAlbumsId,
} from "../../apiV2/a7-service";
import { defaultApiAxiosParams } from "../../api/helpers";
import UploadBox from "./components/UploadBox/UploadBox";
import PhotoCard from "./components/PhotoCard/PhotoCard";
import {
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import Modal from "../../components/Modal/Modal";
import Input from "../../components/Input/Input";
import { showNotification } from "../../components/ShowNotification";
import { useQueryClient } from "react-query";
import { Image } from "antd";
import Button from "../../components/Button/Button";
import {
  downloadImageByUrl,
  FileForZip,
  handleDownloadAll,
  handlePrintPhoto,
} from "./components/PhotoCard/helpers";
import { useMediaQuery } from "react-responsive";

const AlbumPage = () => {
  const { projectId, albumId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isMobile = useMediaQuery({ maxWidth: 768 });

  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [isEditAlbumModalOpen, setIsEditAlbumModalOpen] = useState(false);
  const [isDeleteAlbumModalOpen, setIsDeleteAlbumModalOpen] = useState(false);
  const [isDeletePhotosModalOpen, setIsDeletePhotosModalOpen] = useState(false);
  const [inputAlbumValue, setInputAlbumValue] = useState("");

  const { data: allProjectsData } = useGetProjects({
    axios: defaultApiAxiosParams,
  });

  const { data: albumData } = useGetAlbumsId(albumId ?? "", {
    axios: defaultApiAxiosParams,
  });

  const { data: albumPhotosData, isLoading: isAlbumPhotosLoading } =
    useGetPhotosAlbumAlbumId(albumId ?? "", {
      axios: defaultApiAxiosParams,
    });

  const { data: albumsData } = useGetAlbumsProjectProjectId(projectId ?? "", {
    axios: defaultApiAxiosParams,
  });

  const { mutateAsync: setAlbumCover } = usePutAlbumsCover({
    axios: defaultApiAxiosParams,
  });

  const allAlbumsNames =
    albumsData?.data?.map((item) => item.title ?? "") ?? [];

  const {
    isLoading: isEditAlbumLoading,
    isSuccess: isEditAlbumSuccess,
    mutate: updateAlbum,
  } = usePutAlbumsId({
    axios: defaultApiAxiosParams,
  });

  const {
    isLoading: isDeleteAlbumLoading,
    isSuccess: isDeleteAlbumSuccess,
    mutate: deleteAlbum,
  } = useDeleteAlbumsId({
    axios: defaultApiAxiosParams,
  });

  const { isLoading: isDeletePhotosLoading, mutateAsync: deletePhoto } =
    useDeletePhotosId({
      axios: defaultApiAxiosParams,
    });

  useEffect(() => {
    setInputAlbumValue(albumData?.data?.title ?? "");
  }, [albumData]);

  useEffect(() => {
    if (isEditAlbumSuccess) {
      showNotification({
        message: "Альбом переименован",
        type: "success",
      });
      setIsEditAlbumModalOpen(false);
      void queryClient.invalidateQueries({ queryKey: `/albums/${albumId}` });
      void queryClient.invalidateQueries({
        queryKey: `/albums/project/${projectId}`,
      });
    }
  }, [isEditAlbumSuccess]);

  useEffect(() => {
    if (isDeleteAlbumSuccess) {
      showNotification({
        message: "Альбом удален",
        type: "success",
      });
      setIsDeleteAlbumModalOpen(false);
      void queryClient.invalidateQueries({
        queryKey: `/albums/project/${projectId}`,
      });
      navigate(PublicRoutes.PROJECT.get({ projectId: projectId ?? "" }));
    }
  }, [isDeleteAlbumSuccess]);

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

  useEffect(() => {
    if ((albumPhotos ?? []).length > 0) {
      const firstPhotoId = albumPhotos?.[0]?.id;

      if (firstPhotoId && albumData?.data?.coverPhotoId !== firstPhotoId) {
        setAlbumCover({
          data: {
            photoId: firstPhotoId ?? "",
            albumId: albumId ?? "",
          },
        }).then(() => {
          void queryClient.invalidateQueries({
            queryKey: `/albums/project/${projectId}`,
          });
        });
      }
    }
  }, [albumPhotos, albumData]);

  const handleEditAlbumClick = () => {
    setIsEditAlbumModalOpen(true);
  };

  const handleDeleteAlbumClick = () => {
    setIsDeleteAlbumModalOpen(true);
  };

  const handleDeletePhotosClick = (id?: string) => {
    if (id) {
      setSelectedPhotos([id]);
      setIsDeletePhotosModalOpen(true);
    } else {
      setIsDeletePhotosModalOpen(true);
    }
  };

  const handleDownloadPhotosClick = () => {
    const preparedFilesData: FileForZip[] = (albumPhotos ?? [])
      .filter((item) => selectedPhotos.includes(item.id))
      .map((item) => ({
        url: item.fileUrl ?? "",
        fileName: item.fileName ?? "",
      }));

    handleDownloadAll(preparedFilesData);
  };

  const handleEditAlbumOk = () => {
    const isNameUniq = !allAlbumsNames.some(
      (item) => item.toLocaleLowerCase() === inputAlbumValue.toLocaleLowerCase()
    );

    if (isNameUniq) {
      updateAlbum({
        id: albumId ?? "",
        data: {
          title: inputAlbumValue,
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

  const handleDeleteAlbumOk = () => {
    deleteAlbum({
      id: albumId ?? "",
    });
  };

  const handleDeletePhotosOk = async () => {
    try {
      await Promise.all(selectedPhotos.map((id) => deletePhoto({ id })));

      showNotification({
        message: "Фото удалены",
        type: "success",
      });

      setSelectedPhotos([]);
      setIsDeletePhotosModalOpen(false);

      await queryClient.invalidateQueries({
        queryKey: [`/photos/album/${albumId}`],
      });
    } catch {
      showNotification({
        message: "Ошибка при удалении некоторых фото",
        type: "error",
      });
    }
  };

  const handleEditAlbumCancel = () => {
    setIsEditAlbumModalOpen(false);
    setInputAlbumValue(albumData?.data?.title ?? "");
  };

  const handleDeleteAlbumCancel = () => {
    setIsDeleteAlbumModalOpen(false);
  };

  const handleDeletePhotosCancel = () => {
    setIsDeletePhotosModalOpen(false);
  };

  const toggleSelectPhoto = (id: string) => {
    setSelectedPhotos((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllPhotos = () => {
    const photosIds = (albumPhotos ?? []).map((item) => item.id);
    setSelectedPhotos(photosIds);
  };

  const handleResetSelectedPhotos = () => {
    setSelectedPhotos([]);
  };

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
          <div className={css.icon} onClick={handleEditAlbumClick}>
            <EditOutlined
              style={{
                color: "rgba(255, 255, 255, 0.5)",
                fontSize: isMobile ? "26px" : "unset",
              }}
            />
          </div>
          <div className={css.icon} onClick={handleDeleteAlbumClick}>
            <DeleteOutlined
              style={{
                color: "rgba(255, 255, 255, 0.5)",
                fontSize: isMobile ? "26px" : "unset",
              }}
            />
          </div>
        </div>
      </div>
      <div className={css.actionsContainer}>
        <Button onClick={handleSelectAllPhotos}>Выбрать все</Button>
        <Button onClick={handleResetSelectedPhotos}>Отменить выбор</Button>
        <Button
          disabled={selectedPhotos.length === 0}
          onClick={handleDownloadPhotosClick}
        >
          Скачать выбранные
        </Button>
        <Button
          disabled={selectedPhotos.length === 0}
          onClick={() => handleDeletePhotosClick()}
        >
          Удалить выбранные
        </Button>
      </div>
      <div
        className={css.counter}
      >{`Выбрано фотографий: ${selectedPhotos.length} из ${albumPhotos?.length}`}</div>
      {albumPhotos?.length === 0 ? (
        <UploadBox
          isAlbumLoading={isAlbumPhotosLoading}
          size="big"
          albumId={albumId ?? ""}
        />
      ) : (
        <div className={css.grid}>
          <Image.PreviewGroup
            preview={{
              toolbarRender: (_, info) => {
                const currentPhoto = albumPhotos?.[info.current];

                return (
                  <div className={css.toolbar}>
                    {info.icons.flipXIcon}
                    {info.icons.flipYIcon}
                    {info.icons.rotateLeftIcon}
                    {info.icons.rotateRightIcon}
                    {info.icons.zoomOutIcon}
                    {info.icons.zoomInIcon}
                    <div className={css.customToolbarButtonsContainer}>
                      <PrinterOutlined
                        onClick={() =>
                          handlePrintPhoto(
                            currentPhoto?.fileUrl ?? "",
                            currentPhoto?.fileName ?? ""
                          )
                        }
                        className={css.toolbarBtn}
                      />
                      <DownloadOutlined
                        className={css.toolbarBtn}
                        onClick={() =>
                          downloadImageByUrl(
                            currentPhoto?.fileUrl ?? "",
                            currentPhoto?.fileName ?? ""
                          )
                        }
                      />
                      <DeleteOutlined
                        className={css.toolbarBtn}
                        onClick={() => {
                          handleDeletePhotosClick(currentPhoto?.id);
                        }}
                      />
                    </div>
                  </div>
                );
              },
            }}
            items={albumPhotos?.map((item) => item.fileUrl)}
          >
            {albumPhotos?.map((item) => (
              <PhotoCard
                key={item.id}
                id={item.id}
                url={item.fileUrl}
                name={item.fileName}
                isSelected={selectedPhotos.includes(item.id)}
                albumId={albumId ?? ""}
                onSelect={toggleSelectPhoto}
              />
            ))}
          </Image.PreviewGroup>
          <UploadBox
            isAlbumLoading={isAlbumPhotosLoading}
            size="small"
            albumId={albumId ?? ""}
          />
        </div>
      )}
      <Modal
        title={"Редактирование альбома"}
        open={isEditAlbumModalOpen}
        onOk={handleEditAlbumOk}
        onCancel={handleEditAlbumCancel}
        okButtonName="Сохранить"
        destroyOnHidden
        isLoading={isEditAlbumLoading}
      >
        <Input
          label="Введите название"
          value={inputAlbumValue}
          onChange={(e) => setInputAlbumValue(e.target.value)}
        />
      </Modal>

      <Modal
        title={"Удаление альбома"}
        open={isDeleteAlbumModalOpen}
        onOk={handleDeleteAlbumOk}
        onCancel={handleDeleteAlbumCancel}
        okButtonName="Удалить"
        destroyOnHidden
        isLoading={isDeleteAlbumLoading}
        customOkButtonClassName={css.deleteButton}
      >
        {`Вы уверены, что хотите удалить альбом "${albumData?.data?.title}"? Все данные будут безвозвратно
        утеряны.`}
      </Modal>

      <Modal
        title={"Удаление фото"}
        open={isDeletePhotosModalOpen}
        onOk={handleDeletePhotosOk}
        onCancel={handleDeletePhotosCancel}
        okButtonName="Удалить"
        destroyOnHidden
        isLoading={isDeletePhotosLoading}
        customOkButtonClassName={css.deleteButton}
      >
        {`Вы уверены, что хотите удалить ${
          selectedPhotos.length === 1
            ? `фото ${
                albumPhotos?.find((item) => item.id === selectedPhotos[0])
                  ?.fileName ?? ""
              }`
            : `выбранные (${selectedPhotos.length}) фото`
        }? Данные будут безвозвратно
        утеряны.`}
      </Modal>
    </div>
  );
};

export default AlbumPage;
