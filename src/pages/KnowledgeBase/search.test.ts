import { KnowledgeArticle } from "./instructions";
import { articleMatchesQuery } from "./search";

const article: KnowledgeArticle = {
  id: "guide",
  title: "Руководство",
  paragraphs: ["Вступление"],
  sections: [
    {
      title: "Выбор фотографии",
      blocks: [
        "Лицо должно быть хорошо видно",
        { bullets: ["Разное освещение"] },
        { numbered: ["Определите задачу"] },
        { quote: "Strictly preserve the boy's exact identity" },
      ],
    },
  ],
  tips: ["Совет"],
};

describe("[R-63] поиск по базе знаний", () => {
  it("[R-63] пустой запрос показывает статью", () => {
    expect(articleMatchesQuery(article, "")).toBe(true);
  });

  it("[R-63] находит статью по слову из обычных полей, как раньше", () => {
    expect(articleMatchesQuery(article, "вступление")).toBe(true);
    expect(articleMatchesQuery(article, "совет")).toBe(true);
  });

  it.each(["выбор фотографии", "хорошо видно", "освещение", "определите", "exact identity"])(
    "[R-63] находит статью по «%s» — тексту внутри подраздела (заголовок, абзац, списки, пример промпта)",
    (query) => {
      expect(articleMatchesQuery(article, query)).toBe(true);
    }
  );

  it("[R-63] не находит статью по слову, которого в ней нет", () => {
    expect(articleMatchesQuery(article, "динозавр")).toBe(false);
  });
});
