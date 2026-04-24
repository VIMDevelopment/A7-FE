import {
  JPEG_QUALITY,
  MAX_SIDE,
  WORKER_TIMEOUT_MS,
} from "./constants";
import type { ResizeRequest, ResizeResponse } from "./types";

const isResizeSupported = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    typeof Worker !== "undefined" &&
    typeof OffscreenCanvas !== "undefined" &&
    typeof createImageBitmap !== "undefined"
  );
};

const renameToJpeg = (name: string): string => {
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  return `${base}.jpg`;
};

/**
 * Клиентский ресайз изображения перед загрузкой.
 *
 * - Декодирование через `createImageBitmap` c `imageOrientation: 'from-image'`
 *   (применяется EXIF ориентация, портреты не ложатся на бок).
 * - Если длинная сторона <= MAX_SIDE — возвращает null (оригинал можно слать как есть).
 * - Иначе ресайз до MAX_SIDE по длинной стороне через pica (Lanczos3)
 *   в Web Worker c OffscreenCanvas, кодирование в JPEG q=0.9.
 * - При любой ошибке / отсутствии поддержки — возвращает null (graceful fallback),
 *   предупреждение в console. Вызывающая сторона должна слать оригинал.
 */
export const resizeImageBeforeUpload = async (
  file: File,
): Promise<File | null> => {
  if (!isResizeSupported()) {
    console.warn("[imageResize] capability missing → send original");
    return null;
  }

  if (!file.type.startsWith("image/")) {
    return null;
  }

  return new Promise<File | null>((resolve) => {
    let settled = false;
    let worker: Worker;

    try {
      worker = new Worker(
        new URL("./imageResize.worker.ts", import.meta.url),
      );
    } catch (err) {
      console.warn("[imageResize] worker init failed → send original", err);
      resolve(null);
      return;
    }

    const finish = (result: File | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      worker.terminate();
      resolve(result);
    };

    const timer = setTimeout(() => {
      console.warn("[imageResize] timeout → send original");
      finish(null);
    }, WORKER_TIMEOUT_MS);

    worker.onmessage = (event: MessageEvent<ResizeResponse>) => {
      const data = event.data;

      if (data.status === "resized") {
        const outFile = new File(
          [data.blob],
          renameToJpeg(file.name),
          {
            type: "image/jpeg",
            lastModified: file.lastModified,
          },
        );
        finish(outFile);
        return;
      }

      if (data.status === "skipped") {
        finish(null);
        return;
      }

      console.warn("[imageResize] worker error → send original", data.message);
      finish(null);
    };

    worker.onerror = (err) => {
      console.warn("[imageResize] worker crash → send original", err.message);
      finish(null);
    };

    const request: ResizeRequest = {
      file,
      maxSide: MAX_SIDE,
      quality: JPEG_QUALITY,
    };

    try {
      worker.postMessage(request);
    } catch (err) {
      console.warn("[imageResize] postMessage failed → send original", err);
      finish(null);
    }
  });
};
