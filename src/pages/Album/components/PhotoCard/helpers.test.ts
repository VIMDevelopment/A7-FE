import type { Mock } from "vitest";
import { downloadImageByUrl, handleDownloadAll } from "./helpers";

vi.mock("file-saver", () => ({ saveAs: vi.fn() }));
vi.mock("../../../../components/ShowNotification", () => ({ showNotification: vi.fn() }));

// Грабля AGENTS №25: фото, уже показанное тегом <img> по тому же URL, лежит в HTTP-кэше
// без Access-Control-Allow-Origin (S3 не шлёт Vary: Origin) — обычный fetch из кэша
// блокируется CORS. Скачивание обязано идти мимо кэша.
describe("Скачивание фото альбома мимо HTTP-кэша (грабля №25)", () => {
  beforeEach(() => {
    (global as any).fetch = vi.fn(async () => ({
      ok: true,
      blob: async () => new Blob([new Uint8Array(2048)], { type: "image/jpeg" }),
    }));
    (URL as any).createObjectURL = vi.fn(() => "blob:test");
    (URL as any).revokeObjectURL = vi.fn();
    // клик по ссылке скачивания в jsdom не нужен — подменяем, чтобы не навигировать
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
  });

  it("одно фото: запрос с CORS и cache: no-store", async () => {
    await downloadImageByUrl("https://s3.test/photo.jpg", "photo.jpg");
    expect((global as any).fetch).toHaveBeenCalledWith(
      "https://s3.test/photo.jpg",
      expect.objectContaining({ mode: "cors", cache: "no-store" })
    );
  });

  it("несколько фото в zip: каждый запрос с CORS и cache: no-store", async () => {
    await handleDownloadAll({
      files: [
        { url: "https://s3.test/a.jpg", fileName: "a.jpg" },
        { url: "https://s3.test/b.jpg", fileName: "b.jpg" },
      ],
      albumName: "Альбом",
    });
    const calls = ((global as any).fetch as Mock).mock.calls;
    expect(calls.map((c) => c[0])).toEqual(["https://s3.test/a.jpg", "https://s3.test/b.jpg"]);
    for (const [, init] of calls) {
      expect(init).toEqual(expect.objectContaining({ mode: "cors", cache: "no-store" }));
    }
  });
});
