import React, { useEffect, useMemo, useState } from "react";
import css from "./index.module.css";
import { Breadcrumb, Divider } from "antd";
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
  const [selectedImprovedPhotos, setSelectedImprovedPhotos] = useState<
    string[]
  >([]);
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
    () => albumPhotos?.filter((item) => !!item.current.original),
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

  const handleDownloadPhotosClick = ({
    isOriginal,
  }: {
    isOriginal: boolean;
  }) => {
    const preparedFilesData: FileForZip[] = (albumPhotos ?? [])
      .filter((item) =>
        isOriginal
          ? selectedOriginalPhotos.includes(item.id)
          : selectedImprovedPhotos.includes(item.id)
      )
      .map((item) => ({
        url: isOriginal ? item.default.original : item.current.original,
        fileName: makeFileName({
          fileName: item.fileName,
          isOriginal,
        }),
      }));

    handleDownloadAll({
      files: preparedFilesData,
      albumName: albumName,
      isOriginal,
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

  const toggleSelectPhoto = ({
    id,
    isOriginal,
  }: {
    id: string;
    isOriginal: boolean;
  }) => {
    if (isOriginal) {
      setSelectedOriginalPhotos((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    }
    if (!isOriginal) {
      setSelectedImprovedPhotos((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    }
  };

  const handleSelectAllPhotos = ({ isOriginal }: { isOriginal: boolean }) => {
    const photosIds = (albumPhotos ?? []).map((item) => item.id);
    if (isOriginal) {
      setSelectedOriginalPhotos(photosIds);
    }
    if (!isOriginal) {
      setSelectedImprovedPhotos(photosIds);
    }
  };

  const handleResetSelectedPhotos = ({
    isOriginal,
  }: {
    isOriginal: boolean;
  }) => {
    if (isOriginal) {
      setSelectedOriginalPhotos([]);
    }
    if (!isOriginal) {
      setSelectedImprovedPhotos([]);
    }
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
              title: `Альбом: "${albumName}"`,
            },
          ]}
        />
      </div>
      <Divider className={css.divider} orientation="start">
        Оригиналы
      </Divider>
      <div className={css.actionsContainer}>
        <Button
          onClick={() =>
            handleSelectAllPhotos({
              isOriginal: true,
            })
          }
        >
          Выбрать все
        </Button>
        <Button
          onClick={() =>
            handleResetSelectedPhotos({
              isOriginal: true,
            })
          }
        >
          Отменить выбор
        </Button>
        <Button
          disabled={selectedOriginalPhotos.length === 0}
          onClick={() =>
            handleDownloadPhotosClick({
              isOriginal: true,
            })
          }
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
                            currentPhoto?.default.original ?? "",
                            makeFileName({
                              fileName: currentPhoto?.fileName ?? "",
                              isOriginal: true,
                            })
                          )
                        }
                        className={css.toolbarBtn}
                      />
                      <DownloadOutlined
                        className={css.toolbarBtn}
                        onClick={() =>
                          downloadImageByUrl(
                            currentPhoto?.default.original ?? "",
                            makeFileName({
                              fileName: currentPhoto?.fileName ?? "",
                              isOriginal: true,
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
            items={albumPhotos?.map((item) => item.default.original)}
          >
            {albumPhotos?.map((item) => (
              <PhotoCard
                key={item.id}
                id={item.id}
                isOriginal={true}
                hasImprovedVersion={(improvedPhotos ?? []).some(
                  (el) => item.id === el.id
                )}
                url={item.default.original}
                smallUrl={item.default.small}
                name={item.fileName}
                isSelected={selectedOriginalPhotos.includes(item.id)}
                albumId={albumId ?? ""}
                onSelect={(id: string) =>
                  toggleSelectPhoto({
                    id,
                    isOriginal: true,
                  })
                }
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

      <Divider className={css.divider} orientation="start">
        Улучшенные
      </Divider>
      {improvedPhotos?.length ? (
        <>
          <div className={css.actionsContainer}>
            <Button
              onClick={() =>
                handleSelectAllPhotos({
                  isOriginal: false,
                })
              }
            >
              Выбрать все
            </Button>
            <Button
              onClick={() =>
                handleResetSelectedPhotos({
                  isOriginal: false,
                })
              }
            >
              Отменить выбор
            </Button>
            <Button
              disabled={selectedImprovedPhotos.length === 0}
              onClick={() =>
                handleDownloadPhotosClick({
                  isOriginal: false,
                })
              }
            >
              Скачать выбранные
            </Button>
          </div>
          <div
            className={css.counter}
          >{`Выбрано фотографий: ${selectedImprovedPhotos.length} из ${improvedPhotos.length}`}</div>
          <div className={css.grid}>
            <Image.PreviewGroup
              preview={{
                toolbarRender: (_, info) => {
                  const currentPhoto = improvedPhotos[info.current];

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
                              currentPhoto.current.original,
                              makeFileName({
                                fileName: currentPhoto.fileName,
                                isOriginal: false,
                              })
                            )
                          }
                          className={css.toolbarBtn}
                        />
                        <DownloadOutlined
                          className={css.toolbarBtn}
                          onClick={() =>
                            downloadImageByUrl(
                              currentPhoto.current.original,
                              makeFileName({
                                fileName: currentPhoto.fileName,
                                isOriginal: false,
                              })
                            )
                          }
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
              items={improvedPhotos.map((item) => item.current.original)}
            >
              {improvedPhotos.map((item) => (
                <PhotoCard
                  key={item.id}
                  id={item.id}
                  isOriginal={false}
                  hasImprovedVersion={improvedPhotos.some(
                    (el) => el.id === item.id
                  )}
                  url={item.current.original}
                  smallUrl={item.current.small}
                  name={item.fileName}
                  isSelected={selectedImprovedPhotos.includes(item.id)}
                  albumId={albumId ?? ""}
                  onSelect={(id: string) =>
                    toggleSelectPhoto({
                      id,
                      isOriginal: false,
                    })
                  }
                />
              ))}
            </Image.PreviewGroup>
          </div>
        </>
      ) : (
        <div className={css.emptyInfo}>Здесь пока пусто</div>
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
