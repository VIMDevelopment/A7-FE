import {
  addLayerPayload,
  DEFAULT_MODEL_LABEL,
  describeProcessing,
  processingOf,
} from "./categoryProcessing";
import type { CategoryProcessing } from "../../api/processingApi";

const bound: CategoryProcessing = {
  chainId: "ch-1",
  chainTitle: "Комикс · Seedream 4.5 → Crisp",
  steps: [
    { model: "bytedance/seedream-4.5", kind: "generative", resolution: "2K", estimateUsd: 0.04 },
    { model: "recraft-ai/recraft-crisp-upscale", kind: "upscale", estimateUsd: 0.006 },
  ],
  estimateUsd: 0.046,
  boundAt: "2026-10-05T12:00:00.000Z",
  boundBy: "max@wanmax.io",
};

describe("Привязка категории к цепочке обработки [R-39]", () => {
  it("[R-39.5] processingOf: null/undefined/нет категории → null, иначе привязка", () => {
    expect(processingOf(undefined)).toBeNull();
    expect(processingOf({} as never)).toBeNull();
    expect(processingOf({ processing: null } as never)).toBeNull();
    expect(processingOf({ processing: bound } as never)).toBe(bound);
  });

  it("[R-39.5] describeProcessing: шаги короткими именами с разрешением и цена за фото", () => {
    expect(describeProcessing(bound)).toBe("seedream-4.5 (2К) → recraft-crisp-upscale · ~$0.046 за фото");
  });

  it("[R-39.2][R-61] payload улучшения: categoryId всегда, разрешения нет — модель по умолчанию только 2К, у цепочки оно в шагах", () => {
    expect(addLayerPayload({ photoId: "ph", prompt: "p", categoryId: "cat" })).toStrictEqual({
      photoId: "ph",
      prompt: "p",
      categoryId: "cat",
    });
  });
});

describe("Модель обработки по умолчанию [R-61]", () => {
  it("[R-61] без привязки фото обрабатывает grok-imagine-image-2 за $0.05, только 2К", () => {
    expect(DEFAULT_MODEL_LABEL).toBe("grok-imagine-image-2 ($0.05 за фото, 2К)");
  });
});
