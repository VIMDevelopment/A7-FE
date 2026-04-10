import React, { useState, useEffect, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import Button from "../../../components/Button/Button";
import Select from "../../../components/Select/Select";
import { extractFaceDescriptors, loadFaceApiModels } from "../../../utils/faceDetection";
import { usePostDescriptors } from "../../../apiV2/a7-service";
import type { DescriptorMatchRequest } from "../../../apiV2/a7-service/model/descriptorMatchRequest";
import css from "../index.module.css";
import { defaultApiAxiosParams } from "../../../api/helpers";
import { showNotification } from "../../../components/ShowNotification";

type CameraCaptureProps = {
  onRecognitionSuccess: (photoIds: string[]) => void;
  onError?: (error: string) => void;
};

const CameraCapture: React.FC<CameraCaptureProps> = ({
  onRecognitionSuccess,
  onError,
}) => {
  const webcamRef = useRef<Webcam>(null);
  const permissionStreamRef = useRef<MediaStream | null>(null);
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

  const stopStream = useCallback((stream: MediaStream | null) => {
    if (!stream) {
      return;
    }

    stream.getTracks().forEach((track) => track.stop());
  }, []);

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

          // Передаем найденные ID фото в родительский компонент
          onRecognitionSuccess(matches);
        },
        onError: (error) => {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Ошибка при отправке дескрипторов на сервер";
          setError(errorMessage);
          onError?.(errorMessage);
        },
      },
    });

  // Получение списка доступных камер
  const getDevices = useCallback(async () => {
    try {
      setIsLoadingDevices(true);
      setError(null);

      // Запрашиваем доступ к медиа-устройствам
      stopStream(permissionStreamRef.current);
      const permissionStream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      permissionStreamRef.current = permissionStream;

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
      onError?.(errorMessage);
      console.error("Ошибка доступа к камере:", err);
    } finally {
      setIsLoadingDevices(false);
    }
  }, [selectedDeviceId, onError, stopStream]);

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
        onError?.(errorMessage);
        console.error("Ошибка загрузки моделей:", err);
      } finally {
        setIsLoadingModels(false);
      }
    };
    loadModels();
    return () => {
      stopStream(permissionStreamRef.current);
      permissionStreamRef.current = null;

      const stream = webcamRef.current?.video?.srcObject;
      if (stream instanceof MediaStream) {
        stopStream(stream);
      }
    };
  }, [getDevices, onError, stopStream]);

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
      showNotification({
        message: errorMessage,
        type: "error",
      });
      onError?.(errorMessage);
      console.error("Ошибка извлечения дескрипторов:", err);
    } finally {
      setIsProcessingImage(false);
    }
  }, [capturedImage, sendDescriptors, onError]);

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
  const handleUserMediaError = useCallback(
    (err: string | DOMException) => {
      const errorMessage =
        typeof err === "string"
          ? err
          : err.name === "NotAllowedError"
            ? "Доступ к камере запрещен. Разрешите доступ в настройках браузера."
            : err.name === "NotFoundError"
              ? "Камера не найдена"
              : "Ошибка доступа к камере";
      setError(errorMessage);
      onError?.(errorMessage);
      setIsSwitchingCamera(false);
    },
    [onError]
  );

  if (error) {
    return (
      <div className={css.errorContainer}>
        <div className={css.errorText}>{error}</div>
        <Button onClick={getDevices} className={css.retryButton}>
          Попробовать снова
        </Button>
      </div>
    );
  }

  return (
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
  );
};

export default CameraCapture;

