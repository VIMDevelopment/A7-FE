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
  usePostPhotosImprovement,
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
  getPhotoVersion,
  handleDownloadAll,
  handlePrintPhoto,
  makeFileName,
} from "./components/PhotoCard/helpers";
import useBreadcrumbsBackButton from "../../lib/utils/useBreadcrumbsBackButton/useBreadcrumbsBackButton";
import ImprovementModal from "../../components/ImprovementModal/ImprovementModal";

const AlbumPage = () => {
  const { projectId, subprojectId, albumId } = useParams();
  const queryClient = useQueryClient();

  const [selectedOriginalPhotos, setSelectedOriginalPhotos] = useState<
    string[]
  >([]);
  const [isDeletePhotosModalOpen, setIsDeletePhotosModalOpen] = useState(false);
  const [isImprovePhotoModalOpen, setIsImprovePhotoModalOpen] = useState(false);
  const [improvementPhotoId, setImprovementPhotoId] = useState("");

  const { mutateAsync: improvePhoto } = usePostPhotosImprovement({
    axios: defaultApiAxiosParams,
  });

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
  const albumName = albumData?.data.title ?? "";

  const albumPhotos = useMemo(
    () =>
      albumPhotosData?.data.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateA - dateB;
      }),
    [albumPhotosData]
  );

  const improvedPhotos = useMemo(
    () => albumPhotos?.filter((item) => !!item.current?.original),
    [albumPhotos]
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
      setSelectedOriginalPhotos([id]);
      setIsDeletePhotosModalOpen(true);
    } else {
      setIsDeletePhotosModalOpen(true);
    }
  };

  const handleDownloadPhotosClick = () => {
    const preparedFilesData: FileForZip[] = (albumPhotos ?? [])
      .filter((item) => selectedOriginalPhotos.includes(item.id))
      .map((item) => ({
        url: getPhotoVersion(item).original,
        fileName: makeFileName({
          fileName: item.fileName,
          isOriginal: !item.current,
        }),
      }));

    handleDownloadAll({
      files: preparedFilesData,
      albumName: albumName,
    });
  };

  const handleDeletePhotosOk = async () => {
    try {
      await Promise.all(
        selectedOriginalPhotos.map((id) => deletePhoto({ id }))
      );

      showNotification({
        message: "Фото удалены",
        type: "success",
      });

      setSelectedOriginalPhotos([]);
      setIsDeletePhotosModalOpen(false);

      void queryClient.invalidateQueries({
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

  const handleImprovePhotosClick = () => {
    improvePhoto({
      data: {
        photoIds: selectedOriginalPhotos,
      },
    })
      .then(() => {
        showNotification({
          message: "Фотографии отправлены на улучшение",
          type: "success",
        });
        setSelectedOriginalPhotos([]);
      })
      .catch(() => {
        showNotification({
          message: "Произошла ошибка при улучшении фото",
          type: "error",
        });
      });
  };

  const toggleSelectPhoto = (id: string) => {
    setSelectedOriginalPhotos((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllPhotos = () => {
    const photosIds = (albumPhotos ?? []).map((item) => item.id);
    setSelectedOriginalPhotos(photosIds);
  };

  const handleResetSelectedPhotos = () => {
    setSelectedOriginalPhotos([]);
  };

  const { backButton } = useBreadcrumbsBackButton();

  return (
    <div className={css.container}>
      <div className={css.pageTitle}>{`Альбом: "${albumName}"`}</div>
      <div className={css.navMenu}>
        <Breadcrumb
          className={css.breadCrumbs}
          separator=""
          items={[
            ...backButton,
            {
              title: <Link to={PublicRoutes.PROJECTS.static}>Все филиалы</Link>,
            },
            {
              type: "separator",
            },
            {
              title: (
                <Link
                  to={PublicRoutes.PROJECT.get({ projectId: projectId ?? "" })}
                >
                  Филиал: "{projectName}"
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
              title: `Альбом: "${albumName}"`,
            },
          ]}
        />
      </div>
      <div className={css.actionsContainer}>
        <Button onClick={handleSelectAllPhotos}>Выбрать все</Button>
        <Button onClick={handleResetSelectedPhotos}>Отменить выбор</Button>
        <Button
          disabled={selectedOriginalPhotos.length === 0}
          onClick={() => handleImprovePhotosClick()}
        >
          Улучшить выбранные
        </Button>
        <Button
          disabled={selectedOriginalPhotos.length === 0}
          onClick={handleDownloadPhotosClick}
        >
          Скачать выбранные
        </Button>
        <Button
          disabled={selectedOriginalPhotos.length === 0}
          onClick={() => handleDeletePhotosClick()}
        >
          Удалить выбранные
        </Button>
      </div>
      <div
        className={css.counter}
      >{`Выбрано фотографий: ${selectedOriginalPhotos.length} из ${albumPhotos?.length}`}</div>
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
                            currentPhoto
                              ? getPhotoVersion(currentPhoto).original
                              : "",
                            makeFileName({
                              fileName: currentPhoto?.fileName ?? "",
                              isOriginal: !currentPhoto?.current,
                            })
                          )
                        }
                        className={css.toolbarBtn}
                      />
                      <DownloadOutlined
                        className={css.toolbarBtn}
                        onClick={() =>
                          downloadImageByUrl(
                            currentPhoto
                              ? getPhotoVersion(currentPhoto).original
                              : "",
                            makeFileName({
                              fileName: currentPhoto?.fileName ?? "",
                              isOriginal: !currentPhoto?.current,
                            })
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
            items={albumPhotos?.map((item) => getPhotoVersion(item).original)}
          >
            {albumPhotos?.map((item) => {
              const photoVersion = getPhotoVersion(item);

              return (
                <PhotoCard
                  key={item.id}
                  id={item.id}
                  isOriginal={!item.current}
                  hasImprovedVersion={(improvedPhotos ?? []).some(
                    (el) => item.id === el.id
                  )}
                  url={photoVersion.original}
                  smallUrl={photoVersion.small}
                  name={item.fileName}
                  isSelected={selectedOriginalPhotos.includes(item.id)}
                  albumId={albumId ?? ""}
                  onSelect={toggleSelectPhoto}
                />
              );
            })}
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
        hasImprovedVersion={(improvedPhotos ?? []).some(
          (item) => item.id === improvementPhotoId
        )}
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
        <div className={css.modalContent}>
          <div>{`Вы уверены, что хотите удалить ${
            selectedOriginalPhotos.length === 1
              ? `фото ${
                  albumPhotos?.find(
                    (item) => item.id === selectedOriginalPhotos[0]
                  )?.fileName ?? ""
                }`
              : `выбранные (${selectedOriginalPhotos.length}) фото`
          }? Данные будут безвозвратно
        утеряны.`}</div>
          <div
            className={css.warningInfo}
          >{`Внимание! При удалении оригинала фото, удаляется также его улучшенная версия`}</div>
        </div>
      </Modal>
    </div>
  );
};

export default AlbumPage;
