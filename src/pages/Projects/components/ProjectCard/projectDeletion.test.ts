import { describeProjectDeletion } from "./projectDeletion";

describe("describeProjectDeletion (R-45)", () => {
  it("[R-45] окно называет, что удалится безвозвратно: дни, альбомы, фото, файлы и отпечатки лиц", () => {
    const text = describeProjectDeletion("Тестовый", { days: 12, albums: 31, photos: 2840 });
    expect(text).toMatch(/филиал «Тестовый»/);
    expect(text).toMatch(/12 дней, 31 альбом, 2840 фото/);
    expect(text).toMatch(/файлы в хранилище и отпечатки лиц/);
    expect(text).toMatch(/безвозвратно/);
  });

  it("[R-45] склонения: 1 день, 2 альбома, 1 фото", () => {
    expect(describeProjectDeletion("Х", { days: 1, albums: 2, photos: 1 })).toMatch(/1 день, 2 альбома, 1 фото/);
  });

  it("[R-45] пустой филиал — так и говорим", () => {
    expect(describeProjectDeletion("Х", { days: 0, albums: 0, photos: 0 })).toMatch(/в нём нет ни дней, ни фото/i);
  });

  it("[R-45] сводка не пришла (загрузка/ошибка) — общий текст без чисел", () => {
    expect(describeProjectDeletion("Х", null)).toMatch(/вместе со всеми днями, альбомами и фото/);
  });
});
