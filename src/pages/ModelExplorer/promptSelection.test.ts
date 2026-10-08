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

  it("[R-38] текст прогона — только выбранный промпт категории; body категории не отправляется", () => {
    const p = prompt("1", "Т", {
      history: [version("v1", "старое"), version("v2", "новое")],
    });
    expect(resolvePromptBody(p, "v1")).toBe("старое");
    expect(resolvePromptBody(p, "v2")).toBe("новое");
    expect(resolvePromptBody(p, "нет-такой")).toBeUndefined();
    expect(resolvePromptBody(p, null)).toBeUndefined();
    expect(resolvePromptBody(undefined, "v1")).toBeUndefined();
  });

  it("[R-38] дефолт промпта: единственный подставляется, из нескольких выбирает человек", () => {
    expect(defaultVersionOf(prompt("1", "Т", { history: [version("v1")] }))).toBe("v1");
    expect(
      defaultVersionOf(prompt("1", "Т", { history: [version("v1"), version("v2")] }))
    ).toBeNull();
    expect(defaultVersionOf(prompt("2", "Без истории"))).toBeNull();
  });
});
