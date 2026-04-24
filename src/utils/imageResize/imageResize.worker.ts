/* eslint-disable no-restricted-globals */
import Pica from "pica";
import type { ResizeRequest, ResizeResponse } from "./types";

interface WorkerScope {
  onmessage: ((e: MessageEvent<ResizeRequest>) => void) | null;
  postMessage(message: ResizeResponse, transfer?: Transferable[]): void;
}

// Внутри воркера:
// - WW-фича pica не нужна (и не работает): используем только js + wasm.
// - createCanvas по умолчанию в pica делает document.createElement('canvas'),
//   которого в Worker-контексте нет — внутренние тайлы pica падали бы,
//   что проявлялось как "Pica: cannot use getImageData on canvas...".
//   Подсовываем OffscreenCanvas.
const pica = new Pica({
  features: ["js", "wasm"],
  createCanvas: (w: number, h: number) =>
    new OffscreenCanvas(w, h) as unknown as HTMLCanvasElement,
});

const ctx = self as unknown as WorkerScope;

const post = (msg: ResizeResponse, transfer?: Transferable[]) => {
  if (transfer && transfer.length > 0) {
    ctx.postMessage(msg, transfer);
  } else {
    ctx.postMessage(msg);
  }
};

ctx.onmessage = async (event: MessageEvent<ResizeRequest>) => {
  const { file, maxSide, quality } = event.data;

  let bitmap: ImageBitmap | null = null;

  try {
    // 'from-image' — валидное значение ImageOrientation по спецификации
    // (Chrome 81+, Safari 13.1+, Firefox 77+). TS 4.9 lib.dom ещё не знает
    // этого литерала, поэтому каст через any на объекте опций.
    bitmap = await createImageBitmap(file, {
      imageOrientation: "from-image",
    } as unknown as ImageBitmapOptions);

    const { width, height } = bitmap;
    const longest = Math.max(width, height);

    if (longest <= maxSide) {
      post({ status: "skipped" });
      return;
    }

    const scale = maxSide / longest;
    const targetW = Math.round(width * scale);
    const targetH = Math.round(height * scale);

    const source = new OffscreenCanvas(width, height);
    const sourceCtx = source.getContext("2d");
    if (!sourceCtx) {
      throw new Error("OffscreenCanvas 2d context unavailable");
    }
    sourceCtx.drawImage(bitmap, 0, 0);

    const target = new OffscreenCanvas(targetW, targetH);

    await pica.resize(
      source as unknown as HTMLCanvasElement,
      target as unknown as HTMLCanvasElement,
      { filter: "lanczos3" },
    );

    const blob = await target.convertToBlob({
      type: "image/jpeg",
      quality,
    });

    const buffer = await blob.arrayBuffer();
    const outBlob = new Blob([buffer], { type: "image/jpeg" });
    post({ status: "resized", blob: outBlob }, [buffer]);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    post({ status: "error", message });
  } finally {
    if (bitmap) {
      bitmap.close();
    }
  }
};

export {};
