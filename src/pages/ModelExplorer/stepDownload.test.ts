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

jest.mock("../../components/ShowNotification", () => ({ showNotification: jest.fn() }));

describe("Explorer: скачивание в обход кэша браузера [R-37]", () => {
  // Миниатюра шага — тот же URL, уже загруженный <img> без CORS и закэшированный без
  // Access-Control-Allow-Origin (S3 не шлёт Vary: Origin) → обычный fetch из кэша
  // блокируется CORS. Баг стенда 03.10: «Произошла ошибка при скачивании файла».
  const { downloadStepImage } = jest.requireActual("./stepDownload");
  const { showNotification } = jest.requireMock("../../components/ShowNotification");

  beforeEach(() => {
    (global as any).fetch = jest.fn(async () => ({
      ok: true,
      blob: async () => new Blob(["jpeg-bytes"], { type: "image/jpeg" }),
    }));
    (URL as any).createObjectURL = jest.fn(() => "blob:test");
    (URL as any).revokeObjectURL = jest.fn();
    // клик по ссылке скачивания в jsdom не нужен — подменяем, чтобы не навигировать
    jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    showNotification.mockClear();
  });

  it("[R-37] картинка запрашивается с CORS и мимо HTTP-кэша (cache: no-store)", async () => {
    await downloadStepImage("https://s3.test/explorer/step-1.jpg", createdAt, "Цепочка", 0, "o/m");
    expect((global as any).fetch).toHaveBeenCalledWith(
      "https://s3.test/explorer/step-1.jpg",
      expect.objectContaining({ mode: "cors", cache: "no-store" })
    );
  });

  it("[R-37] файл сохраняется под понятным именем", async () => {
    let downloadName = "";
    (HTMLAnchorElement.prototype.click as jest.Mock).mockImplementation(function (this: HTMLAnchorElement) {
      downloadName = this.download;
    });
    await downloadStepImage("https://s3.test/x.jpg", createdAt, "Цепочка", 1, "o/m");
    expect(downloadName).toBe("2026-10-03_04-06_Цепочка_шаг-2_m.jpg");
  });

  it("[R-37] сбой сети — человеческое сообщение", async () => {
    (global as any).fetch = jest.fn(async () => {
      throw new TypeError("Failed to fetch");
    });
    await downloadStepImage("https://s3.test/x.jpg", createdAt, "Цепочка", 0, "o/m");
    expect(showNotification).toHaveBeenCalledWith(expect.objectContaining({ type: "error" }));
  });
});
