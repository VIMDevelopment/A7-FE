import type { CategoryProcessing, CategoryWithProcessing } from "../../api/processingApi";

/**
 * Модель обработки по умолчанию — категория без привязки к цепочке (R-61, до 13.10 — nano-banana-pro).
 * Только 2К: выбора разрешения в окне улучшения нет. Цена — как в справочнике цен бэкенда.
 */
export const DEFAULT_MODEL_LABEL = "grok-imagine-image-2 ($0.05 за фото, 2К)";

/** Привязка категории или null — без привязки обработка идёт моделью по умолчанию (R-39.3, R-61). */
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
 * Тело запроса улучшения (R-39.2): категория уходит всегда — по ней бэкенд берёт цепочку.
 * Разрешения нет (R-61): модель по умолчанию — только 2К, у цепочки оно задано шагами снимка.
 */
export function addLayerPayload(args: {
  photoId: string;
  prompt: string;
  categoryId: string;
}): { photoId: string; prompt: string; categoryId: string } {
  const { photoId, prompt, categoryId } = args;
  return { photoId, prompt, categoryId };
}
