import React, { useState, useEffect, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import Modal from "../../../../components/Modal/Modal";
import Button from "../../../../components/Button/Button";
import Select from "../../../../components/Select/Select";
import css from "./index.module.css";

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

  // Загрузка устройств при открытии модалки
  useEffect(() => {
    if (open) {
      getDevices();
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
  }, []);

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
    setSelectedDeviceId("");
    setIsSwitchingCamera(false);

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
                    videoConstraints={{
                      deviceId: selectedDeviceId
                        ? { exact: selectedDeviceId }
                        : undefined,
                    }}
                    screenshotFormat="image/jpeg"
                    className={css.webcam}
                    onUserMediaError={handleUserMediaError}
                  />
                </div>
              )}
            </div>

            {!capturedImage && (
              <div className={css.buttonContainer}>
                <Button
                  onClick={capturePhoto}
                  disabled={
                    isLoadingDevices || isSwitchingCamera || !selectedDeviceId
                  }
                  className={css.captureButton}
                >
                  Сфотографировать
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};

export default CameraModal;
