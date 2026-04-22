import React, { useState, useEffect, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import Button from "../../../components/Button/Button";
import Select from "../../../components/Select/Select";
import { extractFaceDescriptors, loadFaceApiModels } from "../../../utils/faceDetection";
import { usePostDescriptorsMask } from "../../../apiV2/a7-service";
import type { DescriptorMaskMatchRequest } from "../../../apiV2/a7-service/model/descriptorMaskMatchRequest";
import type { DescriptorVector } from "../../../apiV2/a7-service/model/descriptorVector";
import css from "../index.module.css";
import { defaultApiAxiosParams } from "../../../api/helpers";
import { showNotification } from "../../../components/ShowNotification";

type CameraCaptureProps = {
  onRecognitionSuccess: (photoIds: string[]) => void;
  onError?: (error: string) => void;
};

const TOTAL_SHOTS = 3;
const ANGLE_HINTS = [
  "Смотрите прямо в камеру (фас)",
  "Поверните голову влево (полупрофиль)",
  "Поверните голову вправо (полупрофиль)",
];

const CameraCapture: React.FC<CameraCaptureProps> = ({
  onRecognitionSuccess,
  onError,
}) => {
  const webcamRef = useRef<Webcam>(null);
  const permissionStreamRef = useRef<MediaStream | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [collectedDescriptors, setCollectedDescriptors] = useState<
    DescriptorVector[]
  >([]);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSwitchingCamera, setIsSwitchingCamera] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  const isAllShotsTaken = capturedImages.length >= TOTAL_SHOTS;
  const currentHint = ANGLE_HINTS[capturedImages.length] ?? "";
  const currentStep = Math.min(capturedImages.length + 1, TOTAL_SHOTS);

  const stopStream = useCallback((stream: MediaStream | null) => {
    if (!stream) {
      return;
    }

    stream.getTracks().forEach((track) => track.stop());
  }, []);

  const { mutate: sendMask, isLoading: isSendingDescriptors } =
    usePostDescriptorsMask({
      axios: defaultApiAxiosParams,
      mutation: {
        onSuccess: async (response) => {
          setError(null);

          const matches = response.data.matches;

          if (!matches || matches.length === 0) {
            showNotification({
              message: "Совпадения не найдены",
              type: "info",
            });
            return;
          }

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

  const getDevices = useCallback(async () => {
    try {
      setIsLoadingDevices(true);
      setError(null);

      stopStream(permissionStreamRef.current);
      const permissionStream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      permissionStreamRef.current = permissionStream;

      const deviceList = await navigator.mediaDevices.enumerateDevices();

      const videoDevices = deviceList.filter(
        (device) => device.kind === "videoinput"
      );

      setDevices(videoDevices);

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

  useEffect(() => {
    getDevices();
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

  const capturePhoto = useCallback(async () => {
    if (!webcamRef.current || isProcessingImage || isAllShotsTaken) {
      return;
    }

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      return;
    }

    try {
      setIsProcessingImage(true);

      const descriptors = await extractFaceDescriptors(imageSrc);
      const [descriptor] = descriptors;

      if (!descriptor) {
        throw new Error("Не удалось извлечь дескриптор лица");
      }

      setCapturedImages((prev) => [...prev, imageSrc]);
      setCollectedDescriptors((prev) => [...prev, descriptor]);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Ошибка при обработке изображения";
      showNotification({
        message: errorMessage,
        type: "error",
      });
      console.error("Ошибка извлечения дескрипторов:", err);
    } finally {
      setIsProcessingImage(false);
    }
  }, [isProcessingImage, isAllShotsTaken]);

  const removeShot = useCallback((index: number) => {
    setCapturedImages((prev) => prev.filter((_, i) => i !== index));
    setCollectedDescriptors((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const retakeAll = useCallback(() => {
    setCapturedImages([]);
    setCollectedDescriptors([]);
  }, []);

  const handleSendDescriptors = useCallback(() => {
    if (collectedDescriptors.length < TOTAL_SHOTS) {
      return;
    }

    const request: DescriptorMaskMatchRequest = {
      mask: collectedDescriptors,
    };

    sendMask({ data: request });
  }, [collectedDescriptors, sendMask]);

  const handleDeviceChange = useCallback((deviceId: string) => {
    setIsSwitchingCamera(true);
    setSelectedDeviceId(deviceId);

    setTimeout(() => {
      setIsSwitchingCamera(false);
    }, 500);
  }, []);

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
      {devices.length > 0 && !isAllShotsTaken && (
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

      {!isAllShotsTaken && (
        <div className={css.hintWrapper}>
          <div className={css.hint}>{currentHint}</div>
          <div className={css.shotCounter}>
            Снимок {currentStep} из {TOTAL_SHOTS}
          </div>
        </div>
      )}

      <div className={css.cameraContainer}>
        {isAllShotsTaken ? (
          <div className={css.previewGrid}>
            {(isSendingDescriptors) && (
              <div className={css.loadingOverlay}>
                <div className={css.loadingText}>
                  Выполняется поиск...
                </div>
              </div>
            )}
            {capturedImages.map((src, idx) => (
              <img
                key={idx}
                src={src}
                alt={`Снимок ${idx + 1}`}
                className={css.previewImage}
              />
            ))}
          </div>
        ) : (
          <div className={css.webcamWrapper}>
            {(isSwitchingCamera || isProcessingImage) && (
              <div className={css.loadingOverlay}>
                <div className={css.loadingText}>
                  {isProcessingImage
                    ? "Обработка снимка..."
                    : "Переключение камеры..."}
                </div>
              </div>
            )}
            <Webcam
              ref={webcamRef}
              audio={false}
              // mirrored=false: иначе react-webcam через ctx.scale(-1,1)
              // зеркалит САМ скриншот, и на сервер уходит зеркальное лицо.
              // Эталонные фото с Canon R6 не зеркалены → рассинхрон дескрипторов.
              // UX-зеркало реализовано чисто CSS'ом через .webcam.
              mirrored={false}
              videoConstraints={{
                deviceId: selectedDeviceId
                  ? { exact: selectedDeviceId }
                  : undefined,
                // Просим максимальное HD-разрешение. Чем больше деталей лица
                // попадёт в faceRecognitionNet, тем ближе будет query-вектор
                // к эталонному (эталоны снимают на R6 в 5K JPEG).
                width: { ideal: 1920 },
                height: { ideal: 1080 },
              }}
              // PNG без потерь: JPEG-артефакты ощутимо смещают дескриптор
              // в 128-мерном пространстве, особенно при матче с «чистыми»
              // эталонами. Размер base64 вырастает, но трафик локален.
              screenshotFormat="image/png"
              forceScreenshotSourceSize
              className={css.webcam}
              onUserMediaError={handleUserMediaError}
            />
          </div>
        )}
      </div>

      {!isAllShotsTaken && capturedImages.length > 0 && (
        <div className={css.thumbsRow}>
          {capturedImages.map((src, idx) => (
            <div key={idx} className={css.thumb}>
              <img src={src} alt={`Снимок ${idx + 1}`} />
              <button
                type="button"
                className={css.thumbRemove}
                onClick={() => removeShot(idx)}
                aria-label={`Переснять снимок ${idx + 1}`}
                disabled={isProcessingImage || isSendingDescriptors}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {!isAllShotsTaken && (
        <div className={css.buttonContainer}>
          <Button
            onClick={capturePhoto}
            disabled={
              isLoadingDevices ||
              isSwitchingCamera ||
              !selectedDeviceId ||
              isLoadingModels ||
              isProcessingImage
            }
            className={css.captureButton}
            showSpinner={isProcessingImage}
          >
            {isLoadingModels ? "Загрузка моделей..." : "Сфотографировать"}
          </Button>
        </div>
      )}

      {isAllShotsTaken && (
        <div className={css.buttonContainer}>
          <Button
            onClick={retakeAll}
            className={css.retakeButton}
            disabled={isSendingDescriptors}
          >
            Переснять всё
          </Button>
          <Button
            onClick={handleSendDescriptors}
            disabled={isSendingDescriptors || isLoadingModels}
            className={css.sendButton}
            showSpinner={isSendingDescriptors}
          >
            Найти
          </Button>
        </div>
      )}
    </>
  );
};

export default CameraCapture;
