import {
  defaultPromptOf,
  promptBodyOf,
  validateNewPromptName,
} from "./promptCatalog";
import type {
  PromptResponse,
  PromptResponseHistoryItem,
} from "../../apiV2/a7-service/model";

const item = (name: string, body = `body-${name}`): PromptResponseHistoryItem => ({
  promptVersion: name,
  promptBody: body,
  description: "",
  rate: 0,
});

const category = (history: PromptResponseHistoryItem[]): PromptResponse =>
  ({ id: "c1", title: "Комикс", body: "stale-category-body", history } as PromptResponse);

describe("Справочник: категории и промпты [R-38]", () => {
  it("[R-38.5] в категории с несколькими промптами промпт не подставляется — выбирает человек", () => {
    expect(defaultPromptOf(category([item("Страница"), item("Значок")]))).toBeNull();
  });

  it("[R-38.5] в категории с одним промптом он подставляется сам", () => {
    expect(defaultPromptOf(category([item("Страница")]))).toBe("Страница");
  });

  it("[R-38.5] без категории или без промптов подставлять нечего", () => {
    expect(defaultPromptOf(undefined)).toBeNull();
    expect(defaultPromptOf(category([]))).toBeNull();
  });

  it("[R-38.5] текст для улучшения — только выбранного промпта; body категории не отправляется", () => {
    const c = category([item("Страница"), item("Значок")]);
    expect(promptBodyOf(c, "Значок")).toBe("body-Значок");
    expect(promptBodyOf(c, null)).toBeUndefined();
    expect(promptBodyOf(c, "Нет такого")).toBeUndefined();
    expect(promptBodyOf(undefined, "Значок")).toBeUndefined();
  });

  it("[R-38.3] имя нового промпта: не пустое и уникальное в категории", () => {
    const c = category([item("Страница")]);
    expect(validateNewPromptName(c, "   ")).toBe("Введите название промпта");
    expect(validateNewPromptName(c, " Страница ")).toBe(
      "Промпт «Страница» уже есть в категории «Комикс»"
    );
    expect(validateNewPromptName(c, "Значок")).toBeNull();
  });
});
