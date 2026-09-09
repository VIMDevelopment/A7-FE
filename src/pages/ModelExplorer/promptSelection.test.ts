import {
  defaultVersionOf,
  resolvePromptBody,
  sortPromptsByFavorites,
} from "./promptSelection";
import type {
  PromptResponse,
  PromptResponseHistoryItem,
} from "../../apiV2/a7-service/model";

const prompt = (id: string, title: string, extra: Partial<PromptResponse> = {}): PromptResponse =>
  ({ id, title, body: `body-${id}`, ...extra } as PromptResponse);

const version = (
  promptVersion: string,
  promptBody?: string
): PromptResponseHistoryItem => ({
  promptVersion,
  promptBody: promptBody ?? "",
  description: "",
  rate: 0,
});

describe("Explorer prompt selection [R-12]", () => {
  it("[R-12] избранные филиала сверху по алфавиту, остальные — в порядке бэкенда (как в модалке улучшения)", () => {
    const list = [prompt("1", "Яркость"), prompt("2", "Атмосфера"), prompt("3", "Фон")];
    const sorted = sortPromptsByFavorites(list, new Set(["3", "2"]));
    expect(sorted.map((p) => p.id)).toEqual(["2", "3", "1"]);
  });

  it("[R-12] без избранного порядок бэкенда не меняется", () => {
    const list = [prompt("1", "Б"), prompt("2", "А")];
    expect(sortPromptsByFavorites(list, new Set()).map((p) => p.id)).toEqual(["1", "2"]);
  });

  it("[R-12] тело запроса — из выбранной версии history, fallback — body промпта", () => {
    const p = prompt("1", "Т", {
      history: [version("v1", "старое"), version("v2", "новое")],
    });
    expect(resolvePromptBody(p, "v1")).toBe("старое");
    expect(resolvePromptBody(p, "v2")).toBe("новое");
    expect(resolvePromptBody(p, "нет-такой")).toBe("body-1");
    expect(resolvePromptBody(p, null)).toBe("body-1");
    expect(resolvePromptBody(undefined, "v1")).toBeUndefined();
  });

  it("[R-12] дефолтная версия — последняя запись history", () => {
    const p = prompt("1", "Т", {
      history: [version("v1"), version("v2")],
    });
    expect(defaultVersionOf(p)).toBe("v2");
    expect(defaultVersionOf(prompt("2", "Без истории"))).toBeNull();
  });
});
