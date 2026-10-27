import { readFileSync } from "fs";
import { join } from "path";
import { KNOWLEDGE_CATEGORIES } from "./instructions";
import { PublicRoutes } from "../../routes/routes";

const prompts = KNOWLEDGE_CATEGORIES.find((category) => category.id === "prompts");
const guide = prompts?.articles.find((article) => article.id === "neural-networks-guide");

describe("[R-63] руководство по работе с нейросетями в «Базе знаний»", () => {
  it("[R-63] лежит в разделе «Промпты» — видят только те, у кого доступ к промптам", () => {
    expect(prompts?.routePath).toBe(PublicRoutes.PROMPTS.static);
    expect(guide?.title).toBe(
      "Практическое руководство по работе с нейросетями для генерации и редактирования изображений"
    );
  });

  it("[R-63] одна статья с девятью подразделами автора, по порядку", () => {
    expect(guide?.sections?.map((section) => section.title)).toEqual([
      "1. Введение",
      "2. Что такое промпт и зачем он нужен",
      "3. Как правильно описывать задачу нейросети",
      "4. Как составлять промпты: не обязательно писать их самостоятельно",
      "5. Какую исходную фотографию лучше выбирать",
      "6. Почему один и тот же промпт работает по-разному в разных нейросетях",
      "7. Как проверять качество промпта",
      "8. Краткий алгоритм работы",
      "9. Пример промпта для Grok",
    ]);
  });

  // Закон №1: на фото живой ребёнок, согласие родителей на публикацию подтвердил Макс 27.10;
  // картинки public/knowledge-base отдаются без входа — в файлах не должно быть метаданных (камера, дата, геометка).
  it("[R-63] фото примера — два файла из статьи автора в public/knowledge-base, без EXIF", () => {
    const shots = guide?.screenshots ?? [];
    expect(shots.map((shot) => shot.src)).toEqual([
      "/knowledge-base/guide-example-before.jpg",
      "/knowledge-base/guide-example-after.jpg",
    ]);
    for (const { src } of shots) {
      const bytes = readFileSync(join(process.cwd(), "public", src));
      expect(bytes.includes(Buffer.from("Exif\0\0"))).toBe(false);
    }
  });

  it("[R-63] у примера с Человеком-пауком — совет-ссылка на статью об авторских правах, и она есть в разделе", () => {
    const copyright = prompts?.articles.find((article) => article.id === "prompts-copyright");
    expect(copyright).toBeDefined();
    expect(guide?.tips?.some((tip) => tip.includes(`«${copyright?.title}»`))).toBe(true);
  });
});
