import { describe, it, expect, vi } from "vitest";
import { recordDownload, recordView } from "./journalEvents";

describe("[R-67.1] окно веба сообщает облаку о скачивании и просмотре фото — для журнала действий", () => {
  it("[R-67.1] скачивание — POST /journal/download с номерами фото без повторов (обе версии одной карточки — одно фото)", async () => {
    const post = vi.fn(async () => ({}));
    await recordDownload(["p-1", "p-2", "p-1"], { baseURL: "x" }, post);
    expect(post).toHaveBeenCalledWith("/journal/download", { photoIds: ["p-1", "p-2"], from: "album" }, { baseURL: "x" });
  });

  it("[R-67.1] больше 1000 фото за раз — частями по 1000 (облако больше в одну запись не берёт), ни одно не теряется", async () => {
    const post = vi.fn(async () => ({}));
    const ids = Array.from({ length: 2001 }, (_, i) => `p-${i}`);
    await recordDownload(ids, {}, post);
    const sent = post.mock.calls.map((call) => (call as unknown as [string, { photoIds: string[] }])[1].photoIds);
    expect(sent.map((chunk) => chunk.length)).toEqual([1000, 1000, 1]);
    expect(sent.flat()).toEqual(ids);
  });

  it("[R-67.1] просмотр в полном размере — POST /journal/view с номером фото", async () => {
    const post = vi.fn(async () => ({}));
    await recordView("p-7", { baseURL: "x" }, post);
    expect(post).toHaveBeenCalledWith("/journal/view", { photoId: "p-7", from: "album" }, { baseURL: "x" });
  });

  it("[R-67.1] облако не ответило — скачивание и просмотр не ломаются, ошибка не всплывает", async () => {
    const post = vi.fn(async () => {
      throw new Error("502");
    });
    await expect(recordDownload(["p-1"], {}, post)).resolves.toBeUndefined();
    await expect(recordView("p-1", {}, post)).resolves.toBeUndefined();
  });

  it("[R-67.1] нечего записывать (пустой выбор, кадр без фото) — запроса нет", async () => {
    const post = vi.fn(async () => ({}));
    await recordDownload([], {}, post);
    await recordView(undefined, {}, post);
    expect(post).not.toHaveBeenCalled();
  });
});
