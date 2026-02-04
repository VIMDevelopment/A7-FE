import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Webcam from "react-webcam";
import Button from "../../components/Button/Button";
import Select from "../../components/Select/Select";
import { extractFaceDescriptors, loadFaceApiModels } from "../../utils/faceDetection";
import {
  usePostDescriptors,
  useDeletePhotosId,
  getPhotosId,
} from "../../apiV2/a7-service";
import type { DescriptorMatchRequest } from "../../apiV2/a7-service/model/descriptorMatchRequest";
import type { Photo } from "../../apiV2/a7-service/model/photo";

import css from "./index.module.css";
import { defaultApiAxiosParams } from "../../api/helpers";
import { showNotification } from "../../components/ShowNotification";
import { Image } from "antd";
import PhotoCard from "../Album/components/PhotoCard/PhotoCard";
import {
  getPhotoVersion,
  handleDownloadAll,
  makeFileName,
  type FileForZip,
} from "../Album/components/PhotoCard/helpers";
import Modal from "../../components/Modal/Modal";

const RecognitionPage = () => {
  const webcamRef = useRef<Webcam>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSwitchingCamera, setIsSwitchingCamera] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [faceDetectionError, setFaceDetectionError] = useState<string | null>(
    null
  );
  const [matchedPhotos, setMatchedPhotos] = useState<Photo[]>([]);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);
  const [isDeletePhotosModalOpen, setIsDeletePhotosModalOpen] = useState(false);

  const { isLoading: isDeletePhotosLoading, mutateAsync: deletePhoto } =
    useDeletePhotosId({
      axios: defaultApiAxiosParams,
    });

  // Хук для отправки дескрипторов
  const { mutate: sendDescriptors, isLoading: isSendingDescriptors } =
    usePostDescriptors({
      axios: defaultApiAxiosParams,
      mutation: {
        onSuccess: async (response) => {
          setError(null);
          setFaceDetectionError(null);

          const matches = response.data.matches;

          if (!matches || matches.length === 0) {
            showNotification({
              message: "Совпадения не найдены",
              type: "info",
            });
            return;
          }

          // Загружаем данные о найденных фото
          try {
            setIsLoadingPhotos(true);
            const photoPromises = matches.map((photoId) =>
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
        },
        onError: (error) => {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Ошибка при отправке дескрипторов на сервер";
          setError(errorMessage);
        },
      },
    });

  // Получение списка доступных камер
  const getDevices = useCallback(async () => {
    try {
      setIsLoadingDevices(true);
      setError(null);

      // Запрашиваем доступ к медиа-устройствам
      await navigator.mediaDevices.getUserMedia({ video: true });

      // Получаем список всех устройств
      const deviceList = await navigator.mediaDevices.enumerateDevices();

      // Фильтруем только видео-устройства
      const videoDevices = deviceList.filter(
        (device) => device.kind === "videoinput"
      );

      setDevices(videoDevices);

      // Устанавливаем первую доступную камеру по умолчанию
      if (videoDevices.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoDevices[0].deviceId);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Не удалось получить доступ к камере";
      setError(errorMessage);
      console.error("Ошибка доступа к камере:", err);
    } finally {
      setIsLoadingDevices(false);
    }
  }, [selectedDeviceId]);

  // Загрузка устройств и моделей face-api.js при монтировании
  useEffect(() => {
    getDevices();
    // Загружаем модели face-api.js при первом открытии
    const loadModels = async () => {
      try {
        setIsLoadingModels(true);
        await loadFaceApiModels();
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Не удалось загрузить модели распознавания лиц";
        setError(errorMessage);
        console.error("Ошибка загрузки моделей:", err);
      } finally {
        setIsLoadingModels(false);
      }
    };
    loadModels();
  }, [getDevices]);

  // Обработка фотографирования
  const capturePhoto = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setCapturedImage(imageSrc);
      }
    }
  }, []);

  // Обработка пересъемки
  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    setFaceDetectionError(null);
  }, []);

  // Обработка распознавания заново
  const handleRecognizeAgain = useCallback(() => {
    setMatchedPhotos([]);
    setSelectedPhotoIds([]);
    setCapturedImage(null);
    setFaceDetectionError(null);
  }, []);

  // Обработка выбора фото
  const toggleSelectPhoto = useCallback((id: string) => {
    setSelectedPhotoIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
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

  // Обработка удаления фото
  const handleDeletePhotosClick = useCallback(() => {
    setIsDeletePhotosModalOpen(true);
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

  // Обработка отправки дескрипторов
  const handleSendDescriptors = useCallback(async () => {
    if (!capturedImage) {
      return;
    }

    try {
      setIsProcessingImage(true);
      setFaceDetectionError(null);
      setError(null);

      // Извлекаем дескрипторы из изображения
      const descriptors = await extractFaceDescriptors(capturedImage);

      // Формируем запрос
      const request: DescriptorMatchRequest = {
        descriptors,
      };

      // Отправляем на сервер
      sendDescriptors({ data: request });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Ошибка при обработке изображения";
      setFaceDetectionError(errorMessage);
      console.error("Ошибка извлечения дескрипторов:", err);
    } finally {
      setIsProcessingImage(false);
    }
  }, [capturedImage, sendDescriptors]);

  // Обработка изменения выбранной камеры
  const handleDeviceChange = useCallback((deviceId: string) => {
    setIsSwitchingCamera(true);
    setSelectedDeviceId(deviceId);

    // Небольшая задержка для переключения камеры
    setTimeout(() => {
      setIsSwitchingCamera(false);
    }, 500);
  }, []);

  // Обработка ошибок webcam
  const handleUserMediaError = useCallback((err: string | DOMException) => {
    const errorMessage =
      typeof err === "string"
        ? err
        : err.name === "NotAllowedError"
          ? "Доступ к камере запрещен. Разрешите доступ в настройках браузера."
          : err.name === "NotFoundError"
            ? "Камера не найдена"
            : "Ошибка доступа к камере";
    setError(errorMessage);
    setIsSwitchingCamera(false);
  }, []);

  const improvedPhotos = useMemo(
    () => matchedPhotos.filter((item) => !!item.current?.original),
    [matchedPhotos]
  );

  return (
    <div className={css.container}>
      <div className={css.pageTitle}>Распознавание</div>

      <div className={css.content}>
        {error ? (
          <div className={css.errorContainer}>
            <div className={css.errorText}>{error}</div>
            <Button onClick={getDevices} className={css.retryButton}>
              Попробовать снова
            </Button>
          </div>
        ) : matchedPhotos.length > 0 ? (
          <>
            <div className={css.actionsContainer}>
              <Button onClick={handleSelectAllPhotos}>Выбрать все</Button>
              <Button onClick={handleResetSelectedPhotos}>Отменить выбор</Button>
              <Button
                disabled={selectedPhotoIds.length === 0}
                onClick={handleDownloadPhotosClick}
              >
                Скачать выбранные
              </Button>
              <Button
                disabled={selectedPhotoIds.length === 0}
                onClick={handleDeletePhotosClick}
              >
                Удалить выбранные
              </Button>
              <Button onClick={handleRecognizeAgain}>
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
                    toolbarRender: (_, info) => (
                      <div className={css.toolbar}>
                        {info.icons.flipXIcon}
                        {info.icons.flipYIcon}
                        {info.icons.rotateLeftIcon}
                        {info.icons.rotateRightIcon}
                        {info.icons.zoomOutIcon}
                        {info.icons.zoomInIcon}
                      </div>
                    )
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
                  ? `фото ${matchedPhotos?.find(
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
          </>
        ) : (
          <>
            {devices.length > 0 && (
              <div className={css.selectWrapper}>
                <Select
                  label="Выберите камеру"
                  value={selectedDeviceId}
                  onChange={handleDeviceChange}
                  disabled={isLoadingDevices || isSwitchingCamera}
                  options={devices.map((device) => ({
                    label:
                      device.label || `Камера ${devices.indexOf(device) + 1}`,
                    value: device.deviceId,
                  }))}
                />
              </div>
            )}

            <div className={css.cameraContainer}>
              {capturedImage ? (
                <div className={css.previewContainer}>
                  {(isProcessingImage || isSendingDescriptors || isLoadingPhotos) && (
                    <div className={css.loadingOverlay}>
                      <div className={css.loadingText}>
                        Выполняется поиск...
                      </div>
                    </div>
                  )}
                  <img
                    src={capturedImage}
                    alt="Сфотографированное изображение"
                    className={css.previewImage}
                  />
                </div>
              ) : (
                <div className={css.webcamWrapper}>
                  {isSwitchingCamera && (
                    <div className={css.loadingOverlay}>
                      <div className={css.loadingText}>
                        Переключение камеры...
                      </div>
                    </div>
                  )}
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    mirrored
                    videoConstraints={{
                      deviceId: selectedDeviceId
                        ? { exact: selectedDeviceId }
                        : undefined,
                    }}
                    screenshotFormat="image/jpeg"
                    className={css.webcam}
                    onUserMediaError={handleUserMediaError}
                    screenshotQuality={1}
                  />
                </div>
              )}
            </div>

            {!capturedImage && (
              <div className={css.buttonContainer}>
                <Button
                  onClick={capturePhoto}
                  disabled={
                    isLoadingDevices ||
                    isSwitchingCamera ||
                    !selectedDeviceId ||
                    isLoadingModels
                  }
                  className={css.captureButton}
                >
                  {isLoadingModels ? "Загрузка моделей..." : "Сфотографировать"}
                </Button>
              </div>
            )}

            {capturedImage && (
              <>
                {faceDetectionError && (
                  <div className={css.errorContainer}>
                    <div className={css.errorText}>{faceDetectionError}</div>
                  </div>
                )}
                <div className={css.buttonContainer}>
                  <Button
                    onClick={retakePhoto}
                    className={css.retakeButton}
                  >
                    Переснять
                  </Button>
                  <Button
                    onClick={handleSendDescriptors}
                    disabled={
                      isProcessingImage ||
                      isSendingDescriptors ||
                      isLoadingModels ||
                      !!faceDetectionError
                    }
                    className={css.sendButton}
                    showSpinner={isProcessingImage || isSendingDescriptors}
                  >
                    Найти
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default RecognitionPage;
