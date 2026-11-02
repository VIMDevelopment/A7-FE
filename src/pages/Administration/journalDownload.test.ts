import { describe, it, expect, vi } from "vitest";
import { downloadJournal, filenameOf } from "./journalDownload";

describe("[R-66.6] [R-67.4] выгрузка журнала облака из веба (админ)", () => {
  it("удаления — GET /journal/deletions.csv с периодом, ответ файлом; имя файла — из ответа сервера", async () => {
    const blob = new Blob(["csv"]);
    const get = vi.fn(async () => ({ data: blob, headers: { "content-disposition": 'attachment; filename="wanmax-deletions-2026-10-01-2026-10-31.csv"' } }));
    const save = vi.fn();
    await downloadJournal("deletion", { from: "2026-10-01", to: "2026-10-31" }, { baseURL: "x" }, get as never, save);
    expect(get).toHaveBeenCalledWith("/journal/deletions.csv", { baseURL: "x", params: { from: "2026-10-01", to: "2026-10-31" }, responseType: "blob" });
    expect(save).toHaveBeenCalledWith(blob, "wanmax-deletions-2026-10-01-2026-10-31.csv");
  });

  it("журнал действий — GET /journal/actions.csv; без имени в ответе — запасное", async () => {
    const get = vi.fn(async () => ({ data: new Blob(["x"]), headers: {} }));
    const save = vi.fn();
    await downloadJournal("action", {}, {}, get as never, save);
    expect(get).toHaveBeenCalledWith("/journal/actions.csv", { params: {}, responseType: "blob" });
    expect(save).toHaveBeenCalledWith(expect.any(Blob), "wanmax-actions.csv");
  });

  it("имя файла из заголовка Content-Disposition", () => {
    expect(filenameOf('attachment; filename="a.csv"', "z.csv")).toBe("a.csv");
    expect(filenameOf(undefined, "z.csv")).toBe("z.csv");
  });
});
