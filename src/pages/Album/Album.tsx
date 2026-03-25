import React, { useEffect, useMemo, useState } from "react";
import css from "./index.module.css";
import { Breadcrumb, Progress } from "antd";
import type { BreadcrumbProps } from "antd";
import { useParams, Link, useMatch } from "react-router-dom";
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
import ReadyProductFolderCard from "./components/ReadyProductFolderCard/ReadyProductFolderCard";
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
import YandexDiskProjectSyncControl from "../../components/YandexDiskProjectSyncControl/YandexDiskProjectSyncControl";

const AlbumPage = () => {
  const { projectId, subprojectId, albumId } = useParams();
  const queryClient = useQueryClient();
  const isReadyProductView = !!useMatch(PublicRoutes.ALBUM_READY_PRODUCT.static);

  const [selectedOriginalPhotos, setSelectedOriginalPhotos] = useState<
    string[]
  >([]);
  const [isDeletePhotosModalOpen, setIsDeletePhotosModalOpen] = useState(false);
  const [isImprovePhotoModalOpen, setIsImprovePhotoModalOpen] = useState(false);
  const [improvementPhotoId, setImprovementPhotoId] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

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

  const readyProductIds = albumData?.data.readyProducts ?? [];

  const sortedAlbumPhotos = useMemo(() => {
    const data = albumPhotosData?.data ?? [];
    return [...data].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateA - dateB;
    });
  }, [albumPhotosData]);

  const mainAlbumPhotos = useMemo(() => {
    const readySet = new Set(readyProductIds);
    return sortedAlbumPhotos.filter((p) => !readySet.has(p.id));
  }, [sortedAlbumPhotos, readyProductIds]);

  const readyAlbumPhotos = useMemo(() => {
    const readySet = new Set(readyProductIds);
    return sortedAlbumPhotos.filter((p) => readySet.has(p.id));
  }, [sortedAlbumPhotos, readyProductIds]);

  const displayPhotos = isReadyProductView ? readyAlbumPhotos : mainAlbumPhotos;

  const improvedPhotos = useMemo(
    () => sortedAlbumPhotos.filter((item) => !!item.current?.original),
    [sortedAlbumPhotos]
  );
  
  useEffect(() => {
    if (isReadyProductView) {
      return;
    }
    if (sortedAlbumPhotos.length > 0) {
      const firstPhotoId = sortedAlbumPhotos[0]?.id;

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
  }, [
    isReadyProductView,
    sortedAlbumPhotos,
    albumData,
    albumId,
    subprojectId,
    setAlbumCover,
    queryClient,
  ]);

  const handleDeletePhotosClick = (id?: string) => {
    if (id) {
      setSelectedOriginalPhotos([id]);
      setIsDeletePhotosModalOpen(true);
    } else {
      setIsDeletePhotosModalOpen(true);
    }
  };

  const handleDownloadPhotosClick = () => {
    const preparedFilesData: FileForZip[] = displayPhotos
      .filter((item) => selectedOriginalPhotos.includes(item.id))
      .map((item) => ({
        url: getPhotoVersion(item).original,
        fileName: makeFileName({
          fileName: item.fileName,
          isOriginal: !item.current,
        }),
      }));

    setIsDownloading(true);
    setDownloadProgress(0);
    handleDownloadAll({
      files: preparedFilesData,
      albumName: albumName,
      onProgress: (done, total) =>
        setDownloadProgress(Math.round((100 / total) * done)),
    })
      .then(() => {
        setDownloadProgress(100);
        setTimeout(() => {
          setIsDownloading(false);
          setDownloadProgress(0);
        }, 2000);
      })
      .catch(() => {
        setIsDownloading(false);
        setDownloadProgress(0);
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
    const photosIds = displayPhotos.map((item) => item.id);
    setSelectedOriginalPhotos(photosIds);
  };

  const handleResetSelectedPhotos = () => {
    setSelectedOriginalPhotos([]);
  };

  const { backButton } = useBreadcrumbsBackButton();

  const breadcrumbItems = useMemo((): NonNullable<
    BreadcrumbProps["items"]
  > => {
    const albumCrumb = isReadyProductView
      ? {
          title: (
            <Link
              to={PublicRoutes.ALBUM.get({
                projectId: projectId ?? "",
                subprojectId: subprojectId ?? "",
                albumId: albumId ?? "",
              })}
            >
              {`Альбом: "${albumName}"`}
            </Link>
          ),
        }
      : {
          title: `Альбом: "${albumName}"`,
        };

    const tail: NonNullable<BreadcrumbProps["items"]> = isReadyProductView
      ? [
          { type: "separator" },
          { title: "Готовый продукт" },
        ]
      : [];

    return [
      ...backButton,
      {
        title: <Link to={PublicRoutes.PROJECTS.static}>Все филиалы</Link>,
      },
      {
        type: "separator" as const,
      },
      {
        title: (
          <Link to={PublicRoutes.PROJECT.get({ projectId: projectId ?? "" })}>
            Филиал: "{projectName}"
          </Link>
        ),
      },
      {
        type: "separator" as const,
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
        type: "separator" as const,
      },
      albumCrumb,
      ...tail,
    ];
  }, [
    backButton,
    isReadyProductView,
    albumName,
    projectId,
    subprojectId,
    albumId,
    projectName,
    subprojectName,
  ]);

  const pageTitle = isReadyProductView
    ? `Альбом: "${albumName}" — Готовый продукт`
    : `Альбом: "${albumName}"`;

  const readyProductUrl = PublicRoutes.ALBUM_READY_PRODUCT.get({
    projectId: projectId ?? "",
    subprojectId: subprojectId ?? "",
    albumId: albumId ?? "",
  });

  return (
    <div className={css.container}>
      <div className={css.pageTitleRow}>
        <div className={css.pageTitle}>{pageTitle}</div>
        <YandexDiskProjectSyncControl projectId={projectId ?? ""} />
      </div>
      <div className={css.navMenu}>
        <Breadcrumb
          className={css.breadCrumbs}
          separator=""
          items={breadcrumbItems}
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
      >{`Выбрано фотографий: ${selectedOriginalPhotos.length} из ${displayPhotos.length}`}</div>
      {sortedAlbumPhotos.length === 0 ? (
        <UploadBox
          isAlbumLoading={isAlbumPhotosLoading}
          size="big"
          albumId={albumId ?? ""}
        />
      ) : (
        <div className={css.grid}>
          {!isReadyProductView && (
            <ReadyProductFolderCard
              to={readyProductUrl}
            />
          )}
          <Image.PreviewGroup
            preview={{
              toolbarRender: (_, info) => {
                const currentPhoto = displayPhotos[info.current];
                const toolbarIcons = (
                  <>
                    {info.icons.flipXIcon}
                    {info.icons.flipYIcon}
                    {info.icons.rotateLeftIcon}
                    {info.icons.rotateRightIcon}
                    {info.icons.zoomOutIcon}
                    {info.icons.zoomInIcon}
                  </>
                );

                return (
                  <div className={css.toolbar}>
                    {toolbarIcons}
                    <div className={css.customToolbarButtonsContainer}>
                      <PrinterOutlined
                        onClick={() =>
                          handlePrintPhoto(
                            getPhotoVersion(currentPhoto).original,
                            makeFileName({
                              fileName: currentPhoto.fileName,
                              isOriginal: !currentPhoto.current,
                            })
                          )
                        }
                        className={css.toolbarBtn}
                      />
                      <DownloadOutlined
                        className={css.toolbarBtn}
                        onClick={() =>
                          downloadImageByUrl(
                            getPhotoVersion(currentPhoto).original,
                            makeFileName({
                              fileName: currentPhoto.fileName,
                              isOriginal: !currentPhoto.current,
                            })
                          )
                        }
                      />
                      <DeleteOutlined
                        className={css.toolbarBtn}
                        onClick={() => {
                          handleDeletePhotosClick(currentPhoto.id);
                        }}
                      />
                      <RocketOutlined
                        className={css.toolbarBtn}
                        onClick={() => {
                          setImprovementPhotoId(currentPhoto.id);
                          setIsImprovePhotoModalOpen(true);
                        }}
                      />
                    </div>
                  </div>
                );
              },
            }}
          >
            {displayPhotos.map((item) => {
              const photoVersion = getPhotoVersion(item);

              return (
                <PhotoCard
                  key={item.id}
                  id={item.id}
                  isOriginal={!item.current}
                  hasImprovedVersion={improvedPhotos.some(
                    (el) => item.id === el.id
                  )}
                  url={photoVersion.original}
                  smallUrl={photoVersion.small}
                  previewUrl={photoVersion.preview}
                  name={item.fileName}
                  isSelected={selectedOriginalPhotos.includes(item.id)}
                  albumId={albumId ?? ""}
                  onSelect={toggleSelectPhoto}
                />
              );
            })}
          </Image.PreviewGroup>
          {!isReadyProductView && (
            <UploadBox
              isAlbumLoading={isAlbumPhotosLoading}
              size="small"
              albumId={albumId ?? ""}
            />
          )}
        </div>
      )}

      {isDownloading && (
        <div className={css.downloadProgressPopup}>
          <div className={css.downloadProgressTitle}>Скачивание</div>
          <Progress
            className={css.downloadProgress}
            strokeColor="#b4b4b4"
            type="circle"
            percent={downloadProgress}
          />
        </div>
      )}

      <ImprovementModal
        photoId={improvementPhotoId}
        isOpen={isImprovePhotoModalOpen}
        hasImprovedVersion={improvedPhotos.some(
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
                  sortedAlbumPhotos.find(
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
