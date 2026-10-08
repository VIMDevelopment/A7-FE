import type { CategoryProcessing, CategoryWithProcessing } from "../../api/processingApi";

/** Привязка категории или null — без привязки обработка идёт nano-banana-pro (R-39.3). */
export function processingOf(
  category: CategoryWithProcessing | undefined
): CategoryProcessing | null {
  return category?.processing ?? null;
}

const usd = (value: number) =>
  `$${value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "")}`;

/** Короткая строка для админа: шаги цепочки и цена за фото (R-39.5). */
export function describeProcessing(processing: CategoryProcessing): string {
  const steps = processing.steps
    .map((s) => `${s.model.split("/")[1] ?? s.model}${s.resolution ? ` (${s.resolution.replace("K", "К")})` : ""}`)
    .join(" → ");
  return `${steps} · ~${usd(processing.estimateUsd)} за фото`;
}

/**
 * Тело запроса улучшения (R-39.2): категория уходит всегда — по ней бэкенд берёт цепочку;
 * разрешение имеет смысл только без привязки (у цепочки оно задано шагами снимка).
 */
export function addLayerPayload(args: {
  photoId: string;
  prompt: string;
  categoryId: string;
  outputResolution: "2K" | "4K";
  processing: CategoryProcessing | null;
}): { photoId: string; prompt: string; categoryId: string; outputResolution?: "2K" | "4K" } {
  const { photoId, prompt, categoryId, outputResolution, processing } = args;
  return processing
    ? { photoId, prompt, categoryId }
    : { photoId, prompt, categoryId, outputResolution };
}
