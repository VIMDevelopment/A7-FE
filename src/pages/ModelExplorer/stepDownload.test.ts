import { stepFileName } from "./stepDownload";

// время прогона задаём в локальной зоне — имя файла тоже в локальной (как видит пользователь)
const createdAt = new Date(2026, 9, 3, 4, 6, 44).toISOString();

describe("Explorer: скачивание картинок цепочек [R-37]", () => {
  it("[R-37] имя файла: дата и время прогона, цепочка, номер шага, модель", () => {
    expect(stepFileName(createdAt, "Комикс · Seedream 4.5 (2К)", 0, "bytedance/seedream-4.5")).toBe(
      "2026-10-03_04-06_Комикс · Seedream 4.5 (2К)_шаг-1_seedream-4.5.jpg"
    );
  });

  it("[R-37] шаги одной цепочки различаются номером и моделью", () => {
    const title = "Комикс · GPT Image 2 → Recraft Crisp";
    expect(stepFileName(createdAt, title, 1, "recraft-ai/recraft-crisp-upscale")).toBe(
      "2026-10-03_04-06_Комикс · GPT Image 2 → Recraft Crisp_шаг-2_recraft-crisp-upscale.jpg"
    );
  });

  it("[R-37] символы, запрещённые в именах файлов, заменяются, пробелы схлопываются", () => {
    expect(stepFileName(createdAt, '  a/b\\c:d*e?f"g<h>i|j  ', 0, "owner/model")).toBe(
      "2026-10-03_04-06_a-b-c-d-e-f-g-h-i-j_шаг-1_model.jpg"
    );
  });
});
