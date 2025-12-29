import * as faceapi from "face-api.js";
import type { DescriptorVector } from "../apiV2/a7-service/model/descriptorVector";

let modelsLoaded = false;
let isLoadingModels = false;

/**
 * Загружает модели face-api.js из папки /weights/
 * Модели загружаются только один раз при первом вызове
 */
export const loadFaceApiModels = async (): Promise<void> => {
  if (modelsLoaded) {
    return;
  }

  if (isLoadingModels) {
    // Ждем завершения текущей загрузки
    while (isLoadingModels) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return;
  }

  try {
    isLoadingModels = true;

    const weightsPath = "/weights";

    // Загружаем необходимые модели
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(weightsPath),
      faceapi.nets.faceLandmark68Net.loadFromUri(weightsPath),
      faceapi.nets.faceRecognitionNet.loadFromUri(weightsPath),
    ]);

    modelsLoaded = true;
  } catch (error) {
    console.error("Ошибка загрузки моделей face-api.js:", error);
    throw new Error("Не удалось загрузить модели распознавания лиц");
  } finally {
    isLoadingModels = false;
  }
};

/**
 * Конвертирует base64 строку в HTMLImageElement
 */
const base64ToImage = (base64: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = base64;
  });
};

/**
 * Извлекает дескрипторы лиц из изображения
 * @param imageSrc - base64 строка изображения или HTMLImageElement
 * @returns Массив дескрипторов (DescriptorVector[])
 * @throws Ошибка, если не найдено лиц или найдено больше одного лица
 */
export const extractFaceDescriptors = async (
  imageSrc: string | HTMLImageElement
): Promise<DescriptorVector[]> => {
  // Убеждаемся, что модели загружены
  await loadFaceApiModels();

  // Конвертируем base64 в изображение, если необходимо
  const image =
    typeof imageSrc === "string" ? await base64ToImage(imageSrc) : imageSrc;

  // Обнаруживаем все лица на изображении
  const detections = await faceapi
    .detectAllFaces(image, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptors();

  if (detections.length === 0) {
    throw new Error("На изображении не найдено лиц");
  }

  if (detections.length > 1) {
    throw new Error(
      `На изображении найдено ${detections.length} лиц. Требуется только одно лицо.`
    );
  }

  // Извлекаем дескриптор (массив из 128 чисел)
  const descriptor = detections[0].descriptor;

  return [
    {
      values: Array.from(descriptor),
    },
  ];
};
