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
  usePostPhotosImprove,
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
  handleDownloadAll,
  handlePrintPhoto,
} from "./components/PhotoCard/helpers";
import {
  buildDeleteConfirmMessage,
  buildPhotoTiles,
  deletionPlanFromTileKeys,
  downloadFilesFromTileKeys,
  photoIdsFromTileKeys,
  previewSourcesFromTiles,
  reconcileSelectedTileKeys,
  tilesForPreview,
  type PhotoTile,
} from "./photoTiles";
import useBreadcrumbsBackButton from "../../lib/utils/useBreadcrumbsBackButton/useBreadcrumbsBackButton";
import ImprovementModal from "../../components/ImprovementModal/ImprovementModal";

const AlbumPage = () => {
  const { projectId, subprojectId, albumId } = useParams();
  const queryClient = useQueryClient();
  const isReadyProductView = !!useMatch(PublicRoutes.ALBUM_READY_PRODUCT.static);

  // R-44: выбор — по ключам ПЛИТОК (у модифицированного фото их две: модификат + оригинал).
  const [selectedTileKeys, setSelectedTileKeys] = useState<string[]>([]);
  const [photoIdsToDelete, setPhotoIdsToDelete] = useState<string[]>([]);
  const [deleteTileLabel, setDeleteTileLabel] = useState("");
  const [partiallySelectedCount, setPartiallySelectedCount] = useState(0);
  const [frozenTiles, setFrozenTiles] = useState<PhotoTile[] | null>(null);
  const [isDeletePhotosModalOpen, setIsDeletePhotosModalOpen] = useState(false);
  const [isImprovePhotoModalOpen, setIsImprovePhotoModalOpen] = useState(false);
  const [improvementPhotoId, setImprovementPhotoId] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const { mutateAsync: improvePhoto } = usePostPhotosImprove({
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
      query: {
        refetchInterval: (data) =>
          data?.data.some((p) => p.status === "processing") ? 2000 : false,
      },
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

  // R-44: модифицированное фото — две плитки (модификат, за ним оригинал).
  const displayTiles = useMemo(() => buildPhotoTiles(displayPhotos), [displayPhotos]);
  // Пока открыт просмотр, список заморожен: опрос при обработке пересобрал бы индексы.
  const gridTiles = tilesForPreview(frozenTiles, displayTiles);

  useEffect(() => {
    setSelectedTileKeys((prev) => reconcileSelectedTileKeys(displayTiles, prev));
  }, [displayTiles]);

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

  // Удаление с одной плитки (тулбар просмотра) — всё фото целиком.
  const handleDeletePhotoClick = (tile: PhotoTile) => {
    setPhotoIdsToDelete([tile.photoId]);
    setDeleteTileLabel(tile.label);
    setPartiallySelectedCount(0);
    setIsDeletePhotosModalOpen(true);
  };

  // Удаление выбранного: фото уходит, только если выбраны ВСЕ его плитки (R-12 точки).
  const handleDeleteSelectedPhotosClick = () => {
    const plan = deletionPlanFromTileKeys(gridTiles, selectedTileKeys);
    setPhotoIdsToDelete(plan.photoIds);
    setPartiallySelectedCount(plan.partiallySelectedCount);
    setDeleteTileLabel(gridTiles.find((t) => selectedTileKeys.includes(t.key))?.label ?? "");
    setIsDeletePhotosModalOpen(true);
  };

  const handleDownloadPhotosClick = () => {
    // Скачиваем выбранные ПЛИТКИ: отмечены обе версии — нужны оба файла.
    const preparedFilesData = downloadFilesFromTileKeys(gridTiles, selectedTileKeys);

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
    // Все выбранные фото выбраны лишь одной карточкой — удалять нечего (R-12).
    if (photoIdsToDelete.length === 0) {
      setIsDeletePhotosModalOpen(false);
      return;
    }
    try {
      await Promise.all(photoIdsToDelete.map((id) => deletePhoto({ id })));

      showNotification({
        message: "Фото удалены",
        type: "success",
      });

      const deleted = new Set(photoIdsToDelete);
      setSelectedTileKeys((prev) =>
        prev.filter((key) => !gridTiles.some((t) => t.key === key && deleted.has(t.photoId)))
      );
      setPhotoIdsToDelete([]);
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
        // одно фото — одна обработка, даже если выбраны обе его плитки
        photoIds: photoIdsFromTileKeys(gridTiles, selectedTileKeys),
        prompt: "mock"
      },
    })
      .then(() => {
        showNotification({
          message: "Фотографии отправлены на улучшение",
          type: "success",
        });
        setSelectedTileKeys([]);
      })
      .catch(() => {
        showNotification({
          message: "Произошла ошибка при улучшении фото",
          type: "error",
        });
      });
  };

  const toggleSelectPhoto = (key: string) => {
    setSelectedTileKeys((prev) =>
      prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]
    );
  };

  const handleSelectAllPhotos = () => {
    setSelectedTileKeys(gridTiles.map((tile) => tile.key));
  };

  const handleResetSelectedPhotos = () => {
    setSelectedTileKeys([]);
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
          disabled={selectedTileKeys.length === 0}
          onClick={() => handleImprovePhotosClick()}
        >
          Улучшить выбранные
        </Button>
        <Button
          disabled={selectedTileKeys.length === 0}
          onClick={handleDownloadPhotosClick}
        >
          Скачать выбранные
        </Button>
        <Button
          disabled={selectedTileKeys.length === 0}
          onClick={handleDeleteSelectedPhotosClick}
        >
          Удалить выбранные
        </Button>
      </div>
      <div
        className={css.counter}
      >{`Выбрано карточек: ${selectedTileKeys.length} из ${gridTiles.length}`}</div>
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
            // Явный список превью в порядке плиток — тулбар адресует кадр индексом плитки.
            items={previewSourcesFromTiles(gridTiles)}
            preview={{
              onVisibleChange: (visible) => setFrozenTiles(visible ? displayTiles : null),
              toolbarRender: (_, info) => {
                const currentTile = gridTiles[info.current];
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
                          currentTile &&
                          handlePrintPhoto(currentTile.versions.original, currentTile.downloadFileName)
                        }
                        className={css.toolbarBtn}
                      />
                      <DownloadOutlined
                        className={css.toolbarBtn}
                        onClick={() =>
                          currentTile &&
                          downloadImageByUrl(currentTile.versions.original, currentTile.downloadFileName)
                        }
                      />
                      <DeleteOutlined
                        className={css.toolbarBtn}
                        onClick={() => currentTile && handleDeletePhotoClick(currentTile)}
                      />
                      <RocketOutlined
                        className={css.toolbarBtn}
                        onClick={() => {
                          if (!currentTile) return;
                          setImprovementPhotoId(currentTile.photoId);
                          setIsImprovePhotoModalOpen(true);
                        }}
                      />
                    </div>
                  </div>
                );
              },
            }}
          >
            {gridTiles.map((tile) => (
              <PhotoCard
                key={tile.key}
                id={tile.photoId}
                selectionKey={tile.key}
                isOriginal={tile.variant !== "modified"}
                hasImprovedVersion={tile.variant !== "single"}
                url={tile.versions.original}
                smallUrl={tile.versions.small}
                previewUrl={tile.versions.preview}
                name={tile.label}
                downloadFileName={tile.downloadFileName}
                canRename={tile.variant !== "original"}
                isSelected={selectedTileKeys.includes(tile.key)}
                albumId={albumId ?? ""}
                status={tile.variant === "original" ? undefined : tile.photo.status}
                onSelect={toggleSelectPhoto}
              />
            ))}
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
          <div>
            {buildDeleteConfirmMessage({
              photoCount: photoIdsToDelete.length,
              tileLabel: deleteTileLabel,
              partiallySelectedCount,
            })}
          </div>
          <div
            className={css.warningInfo}
          >{`Внимание! Удаляется всё фото целиком — и модифицированная версия, и оригинал (в альбоме пропадут обе карточки).`}</div>
        </div>
      </Modal>
    </div>
  );
};

export default AlbumPage;
