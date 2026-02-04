import React, { useState, useCallback, useMemo } from "react";
import Button from "../../../components/Button/Button";
import {
  useDeletePhotosId,
  getPhotosId,
  usePostPhotosImprovement,
} from "../../../apiV2/a7-service";
import type { Photo } from "../../../apiV2/a7-service/model/photo";
import css from "../index.module.css";
import { defaultApiAxiosParams } from "../../../api/helpers";
import { showNotification } from "../../../components/ShowNotification";
import { Image } from "antd";
import PhotoCard from "../../Album/components/PhotoCard/PhotoCard";
import {
  getPhotoVersion,
  handleDownloadAll,
  makeFileName,
  type FileForZip,
  downloadImageByUrl,
  handlePrintPhoto,
} from "../../Album/components/PhotoCard/helpers";
import Modal from "../../../components/Modal/Modal";
import {
  DeleteOutlined,
  DownloadOutlined,
  PrinterOutlined,
  RocketOutlined,
} from "@ant-design/icons";
import ImprovementModal from "../../../components/ImprovementModal/ImprovementModal";

type RecognitionResultsProps = {
  photoIds: string[];
  onRecognizeAgain: () => void;
};

const RecognitionResults: React.FC<RecognitionResultsProps> = ({
  photoIds,
  onRecognizeAgain,
}) => {
  const [matchedPhotos, setMatchedPhotos] = useState<Photo[]>([]);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);
  const [isDeletePhotosModalOpen, setIsDeletePhotosModalOpen] = useState(false);
  const [isImprovePhotoModalOpen, setIsImprovePhotoModalOpen] = useState(false);
  const [improvementPhotoId, setImprovementPhotoId] = useState("");

  const { isLoading: isDeletePhotosLoading, mutateAsync: deletePhoto } =
    useDeletePhotosId({
      axios: defaultApiAxiosParams,
    });

  const { mutateAsync: improvePhoto } = usePostPhotosImprovement({
    axios: defaultApiAxiosParams,
  });

  // Загружаем данные о найденных фото
  React.useEffect(() => {
    const loadPhotos = async () => {
      if (photoIds.length === 0) {
        return;
      }

      try {
        setIsLoadingPhotos(true);
        const photoPromises = photoIds.map((photoId) =>
          getPhotosId(photoId, defaultApiAxiosParams).then(
            (res) => res.data
          )
        );
        const photos = await Promise.all(photoPromises);
        setMatchedPhotos(photos);
      } catch (err) {
        console.error("Ошибка загрузки фото:", err);
        showNotification({
          message: "Ошибка при загрузке найденных фото",
          type: "error",
        });
      } finally {
        setIsLoadingPhotos(false);
      }
    };

    loadPhotos();
  }, [photoIds]);

  // Обработка выбора фото
  const toggleSelectPhoto = useCallback((id: string) => {
    setSelectedPhotoIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  // Обработка удаления фото через выпадающий список
  const handlePhotoDelete = useCallback((id: string) => {
    setMatchedPhotos((prev) => prev.filter((photo) => photo.id !== id));
    setSelectedPhotoIds((prev) => prev.filter((photoId) => photoId !== id));
  }, []);

  // Выбрать все фото
  const handleSelectAllPhotos = useCallback(() => {
    const photosIds = matchedPhotos.map((item) => item.id);
    setSelectedPhotoIds(photosIds);
  }, [matchedPhotos]);

  // Отменить выбор
  const handleResetSelectedPhotos = useCallback(() => {
    setSelectedPhotoIds([]);
  }, []);

  // Скачать выбранные фото
  const handleDownloadPhotosClick = useCallback(() => {
    const preparedFilesData: FileForZip[] = matchedPhotos
      .filter((item) => selectedPhotoIds.includes(item.id))
      .map((item) => ({
        url: getPhotoVersion(item).original,
        fileName: makeFileName({
          fileName: item.fileName,
          isOriginal: !item.current,
        }),
      }));

    handleDownloadAll({
      files: preparedFilesData,
      albumName: "Результаты распознавания",
    });
  }, [matchedPhotos, selectedPhotoIds]);

  // Обработка улучшения фото
  const handleImprovePhotosClick = useCallback(() => {
    improvePhoto({
      data: {
        photoIds: selectedPhotoIds,
      },
    })
      .then(() => {
        showNotification({
          message: "Фотографии отправлены на улучшение",
          type: "success",
        });
        setSelectedPhotoIds([]);
      })
      .catch(() => {
        showNotification({
          message: "Произошла ошибка при улучшении фото",
          type: "error",
        });
      });
  }, [selectedPhotoIds, improvePhoto, photoIds]);

  // Обработка удаления фото
  const handleDeletePhotosClick = useCallback((id?: string) => {
    if (id) {
      setSelectedPhotoIds([id]);
    }
    setIsDeletePhotosModalOpen(true);
  }, []);

  const handleDeleteSelectedPhotosClick = useCallback(() => {
    setIsDeletePhotosModalOpen(true);
  }, []);

  const handleImprovePhotoCancel = useCallback(() => {
    setIsImprovePhotoModalOpen(false);
  }, []);

  const handleDeletePhotosOk = useCallback(async () => {
    try {
      await Promise.all(
        selectedPhotoIds.map((id) => deletePhoto({ id }))
      );

      showNotification({
        message: "Фото удалены",
        type: "success",
      });

      setSelectedPhotoIds([]);
      setIsDeletePhotosModalOpen(false);
      setMatchedPhotos((prev) =>
        prev.filter((photo) => !selectedPhotoIds.includes(photo.id))
      );
    } catch {
      showNotification({
        message: "Ошибка при удалении некоторых фото",
        type: "error",
      });
    }
  }, [selectedPhotoIds, deletePhoto]);

  const handleDeletePhotosCancel = useCallback(() => {
    setIsDeletePhotosModalOpen(false);
  }, []);

  const improvedPhotos = useMemo(
    () => matchedPhotos.filter((item) => !!item.current?.original),
    [matchedPhotos]
  );

  return (
    <>
      <div className={css.actionsContainer}>
        <Button onClick={handleSelectAllPhotos}>Выбрать все</Button>
        <Button onClick={handleResetSelectedPhotos}>Отменить выбор</Button>
        <Button
          disabled={selectedPhotoIds.length === 0}
          onClick={handleImprovePhotosClick}
        >
          Улучшить выбранные
        </Button>
        <Button
          disabled={selectedPhotoIds.length === 0}
          onClick={handleDownloadPhotosClick}
        >
          Скачать выбранные
        </Button>
        <Button
          disabled={selectedPhotoIds.length === 0}
          onClick={handleDeleteSelectedPhotosClick}
        >
          Удалить выбранные
        </Button>
        <Button onClick={onRecognizeAgain}>
          Распознать заново
        </Button>
      </div>
      <div
        className={css.counter}
      >{`Выбрано фотографий: ${selectedPhotoIds.length} из ${matchedPhotos.length}`}</div>
      {isLoadingPhotos ? (
        <div className={css.loadingOverlay}>
          <div className={css.loadingText}>Загрузка фото...</div>
        </div>
      ) : (
        <div className={css.grid}>
          <Image.PreviewGroup
            preview={{
              toolbarRender: (_, info) => {
                const currentPhoto = matchedPhotos?.[info.current];

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
            items={matchedPhotos.map((item) =>
              getPhotoVersion(item).original
            )}
          >
            {matchedPhotos.map((item) => {
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
                  name={item.fileName}
                  isSelected={selectedPhotoIds.includes(item.id)}
                  albumId={item.albumId}
                  onSelect={toggleSelectPhoto}
                  onDelete={handlePhotoDelete}
                />
              );
            })}
          </Image.PreviewGroup>
        </div>
      )}

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
          <div>{`Вы уверены, что хотите удалить ${selectedPhotoIds.length === 1
            ? `фото ${matchedPhotos.find(
              (item) => item.id === selectedPhotoIds[0]
            )?.fileName ?? ""
            }`
            : `выбранные (${selectedPhotoIds.length}) фото`
            }? Данные будут безвозвратно
          утеряны.`}</div>
          <div
            className={css.warningInfo}
          >{`Внимание! При удалении оригинала фото, удаляется также его улучшенная версия`}</div>
        </div>
      </Modal>

      <ImprovementModal
        photoId={improvementPhotoId}
        isOpen={isImprovePhotoModalOpen}
        hasImprovedVersion={improvedPhotos.some(
          (item) => item.id === improvementPhotoId
        )}
        onCancel={handleImprovePhotoCancel}
        onOk={handleImprovePhotoCancel}
      />
    </>
  );
};

export default RecognitionResults;

