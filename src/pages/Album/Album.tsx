import React, { useEffect, useMemo, useState } from "react";
import css from "./index.module.css";
import { Breadcrumb } from "antd";
import { useParams, Link } from "react-router-dom";
import { PublicRoutes } from "../../routes/routes";
import {
  useDeletePhotosId,
  useGetAlbumsId,
  useGetPhotosAlbumAlbumId,
  useGetProjectsProjectId,
  useGetSubprojectsId,
  usePutAlbumsCover,
} from "../../apiV2/a7-service";
import { defaultApiAxiosParams } from "../../api/helpers";
import UploadBox from "./components/UploadBox/UploadBox";
import PhotoCard from "./components/PhotoCard/PhotoCard";
import {
  DeleteOutlined,
  DownloadOutlined,
  PrinterOutlined,
  RocketOutlined,
} from "@ant-design/icons";
import Modal from "../../components/Modal/Modal";
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
import useBreadcrumbsBackButton from "../../lib/utils/useBreadcrumbsBackButton/useBreadcrumbsBackButton";
import ImprovementModal from "../../components/ImprovementModal/ImprovementModal";

const AlbumPage = () => {
  const { projectId, subprojectId, albumId } = useParams();
  const queryClient = useQueryClient();

  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [isDeletePhotosModalOpen, setIsDeletePhotosModalOpen] = useState(false);
  const [isImprovePhotoModalOpen, setIsImprovePhotoModalOpen] = useState(false);
  const [improvementPhotoId, setImprovementPhotoId] = useState("");

  const { data: projectData } = useGetProjectsProjectId(projectId ?? "", {
    axios: defaultApiAxiosParams,
  });

  const { data: subprojectData } = useGetSubprojectsId(subprojectId ?? "", {
    axios: defaultApiAxiosParams,
  });

  const { data: albumData } = useGetAlbumsId(albumId ?? "", {
    axios: defaultApiAxiosParams,
  });

  const { data: albumPhotosData, isLoading: isAlbumPhotosLoading } =
    useGetPhotosAlbumAlbumId(albumId ?? "", {
      axios: defaultApiAxiosParams,
    });

  const { mutateAsync: setAlbumCover } = usePutAlbumsCover({
    axios: defaultApiAxiosParams,
  });

  const { isLoading: isDeletePhotosLoading, mutateAsync: deletePhoto } =
    useDeletePhotosId({
      axios: defaultApiAxiosParams,
    });

  const projectName = projectData?.data.name ?? "";
  const subprojectName = subprojectData?.data.name ?? "";
  const albumName = albumData?.data.title;

  const albumPhotos = useMemo(
    () =>
      albumPhotosData?.data.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateA - dateB;
      }),
    [albumPhotosData]
  );

  useEffect(() => {
    if ((albumPhotos ?? []).length > 0) {
      const firstPhotoId = albumPhotos?.[0]?.id;

      if (firstPhotoId && albumData?.data.coverPhotoId !== firstPhotoId) {
        setAlbumCover({
          data: {
            photoId: firstPhotoId,
            albumId: albumId ?? "",
          },
        }).then(() => {
          void queryClient.invalidateQueries({
            queryKey: `/albums/subproject/${subprojectId}`,
          });
        });
      }
    }
  }, [albumPhotos, albumData]);

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
        url: item.default.original,
        fileName: item.fileName,
      }));

    handleDownloadAll(preparedFilesData);
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

  const handleDeletePhotosCancel = () => {
    setIsDeletePhotosModalOpen(false);
  };

  const handleImprovePhotoCancel = () => {
    setIsImprovePhotoModalOpen(false);
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

  const { backButton } = useBreadcrumbsBackButton();

  return (
    <div className={css.container}>
      <div className={css.pageTitle}>{albumName}</div>
      <div className={css.navMenu}>
        <Breadcrumb
          className={css.breadCrumbs}
          separator=""
          items={[
            ...backButton,
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
                  Проект: "{projectName}"
                </Link>
              ),
            },
            {
              type: "separator",
            },
            {
              title: (
                <Link
                  to={PublicRoutes.SUBPROJECT.get({
                    projectId: projectId ?? "",
                    subprojectId: subprojectId ?? "",
                  })}
                >
                  Папка: "{subprojectName}"
                </Link>
              ),
            },
            {
              type: "separator",
            },
            {
              title: `Альбом: "${albumName ?? ""}"`,
            },
          ]}
        />
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
                            currentPhoto?.default.original ?? "",
                            currentPhoto?.fileName ?? ""
                          )
                        }
                        className={css.toolbarBtn}
                      />
                      <DownloadOutlined
                        className={css.toolbarBtn}
                        onClick={() =>
                          downloadImageByUrl(
                            currentPhoto?.default.original ?? "",
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
                      <RocketOutlined
                        className={css.toolbarBtn}
                        onClick={() => {
                          setImprovementPhotoId(currentPhoto?.id ?? "");
                          setIsImprovePhotoModalOpen(true);
                        }}
                      />
                    </div>
                  </div>
                );
              },
            }}
            items={albumPhotos?.map((item) => item.default.original)}
          >
            {albumPhotos?.map((item) => (
              <PhotoCard
                key={item.id}
                id={item.id}
                url={item.default.original}
                smallUrl={item.default.small}
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

      <ImprovementModal
        photoId={improvementPhotoId}
        isOpen={isImprovePhotoModalOpen}
        onCancel={handleImprovePhotoCancel}
        onOk={handleImprovePhotoCancel}
      />

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
