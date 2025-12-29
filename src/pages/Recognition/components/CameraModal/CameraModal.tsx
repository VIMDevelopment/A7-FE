import React, { useState, useEffect, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import Modal from "../../../../components/Modal/Modal";
import Button from "../../../../components/Button/Button";
import Select from "../../../../components/Select/Select";
import { extractFaceDescriptors, loadFaceApiModels } from "../../../../utils/faceDetection";
import { usePostDescriptors } from "../../../../apiV2/a7-service";
import type { DescriptorMatchRequest } from "../../../../apiV2/a7-service/model/descriptorMatchRequest";
import css from "./index.module.css";
import { defaultApiAxiosParams } from "../../../../api/helpers";

type CameraModalProps = {
  open: boolean;
  onClose: () => void;
};

const CameraModal: React.FC<CameraModalProps> = ({ open, onClose }) => {
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

  // Хук для отправки дескрипторов
  const { mutate: sendDescriptors, isLoading: isSendingDescriptors } =
    usePostDescriptors({
      axios: defaultApiAxiosParams,
      mutation: {
        onSuccess: () => {
          setError(null);
          setFaceDetectionError(null);
          // Можно показать уведомление об успехе
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

  // Загрузка устройств и моделей face-api.js при открытии модалки
  useEffect(() => {
    if (open) {
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
    }
  }, [open, getDevices]);

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

  // Обработка закрытия модалки
  const handleClose = useCallback(() => {
    // Останавливаем видеопоток
    if (webcamRef.current?.video?.srcObject) {
      const stream = webcamRef.current.video.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      webcamRef.current.video.srcObject = null;
    }

    // Сбрасываем состояния
    setCapturedImage(null);
    setError(null);
    setFaceDetectionError(null);
    setSelectedDeviceId("");
    setIsSwitchingCamera(false);
    setIsProcessingImage(false);

    onClose();
  }, [onClose]);

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

  return (
    <Modal
      open={open}
      onCancel={capturedImage ? retakePhoto : handleClose}
      onOk={capturedImage ? handleClose : undefined}
      okButtonName={capturedImage ? "Закрыть" : undefined}
      cancelButtonName={capturedImage ? "Переснять" : "Отмена"}
      withFooter={true}
      title="Распознавание с камеры"
      width={800}
      customRootClassName={css.modalRoot}
    >
      <div className={css.container}>
        {error ? (
          <div className={css.errorContainer}>
            <div className={css.errorText}>{error}</div>
            <Button onClick={getDevices} className={css.retryButton}>
              Попробовать снова
            </Button>
          </div>
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
                  {(isProcessingImage || isSendingDescriptors) && (
                    <div className={css.loadingOverlay}>
                      <div className={css.loadingText}>
                        {isProcessingImage
                          ? "Обработка изображения..."
                          : "Отправка дескрипторов..."}
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
                    Отправить дескрипторы
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};

export default CameraModal;
