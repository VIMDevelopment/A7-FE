import * as faceapi from "face-api.js";
// tfjs-core тянется транзитивно face-api.js. В версии 1.7.0 WebGL-backend
// регистрируется автоматически, но мы явно активируем его и ждём готовности,
// чтобы гарантированно не оказаться на CPU на старте.
import * as tf from "@tensorflow/tfjs-core";
import { DescriptorVector } from "../apiV2/a7-service/model";

let modelsLoaded = false;
let isLoadingModels = false;
let backendReady = false;

// Порог уверенности детектора лиц. 0.4 даёт ощутимо меньше пропусков по
// сравнению с дефолтом 0.5 при крупноплановой съёмке с веб-камеры.
const DETECTOR_MIN_CONFIDENCE = 0.4;

/**
 * Активирует WebGL-backend tfjs. Без этого на некоторых сборках tfjs мог
 * откатиться на CPU, что на слабых устройствах давало «зависания» детекции.
 */
const ensureWebglBackend = async (): Promise<void> => {
  if (backendReady) {
    return;
  }

  try {
    if (tf.getBackend() !== "webgl") {
      await tf.setBackend("webgl");
    }
    await tf.ready();
    backendReady = true;
  } catch (error) {
    console.warn(
      "Не удалось активировать WebGL-backend tfjs, используется дефолтный",
      error
    );
    await tf.ready();
    backendReady = true;
  }
};

/**
 * Загружает модели face-api.js из папки /weights/.
 * Используем ту же связку, что и на бэке (SsdMobilenetv1 + landmarks68 +
 * recognition), чтобы 128-мерные дескрипторы с фронта и бэка совпадали
 * по геометрии выравнивания лица.
 */
export const loadFaceApiModels = async (): Promise<void> => {
  if (modelsLoaded) {
    return;
  }

  if (isLoadingModels) {
    while (isLoadingModels) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return;
  }

  try {
    isLoadingModels = true;

    await ensureWebglBackend();

    const weightsPath = "/weights";

    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(weightsPath),
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

const base64ToImage = (base64: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = base64;
  });
};

/**
 * Извлекает дескрипторы лиц из изображения.
 * @param imageSrc base64-строка изображения или HTMLImageElement
 * @returns Массив дескрипторов (DescriptorVector[])
 * @throws Ошибка, если не найдено лиц или найдено больше одного лица
 */
export const extractFaceDescriptors = async (
  imageSrc: string | HTMLImageElement
): Promise<DescriptorVector[]> => {
  await loadFaceApiModels();

  const image =
    typeof imageSrc === "string" ? await base64ToImage(imageSrc) : imageSrc;

  const detections = await faceapi
    .detectAllFaces(
      image,
      // SsdMobilenetv1 совпадает с детектором бэка → одинаковые bbox/landmarks
      // → совместимые дескрипторы. minConfidence 0.4 терпимее к свету/ракурсу,
      // чем дефолтный TinyFaceDetector со scoreThreshold 0.5.
      new faceapi.SsdMobilenetv1Options({ minConfidence: DETECTOR_MIN_CONFIDENCE })
    )
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

  const descriptor = detections[0].descriptor;

  return [
    {
      values: Array.from(descriptor),
    },
  ];
};
