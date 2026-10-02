import { canStartWithoutReference, compareTarget, effectivePrompt } from "./runMode";

describe("Explorer: свой промпт и прогон без эталона [R-35]", () => {
  it("[R-35] свой промпт уходит дословно (обрезаются только пробелы по краям), справочник игнорируется", () => {
    expect(effectivePrompt("own", "из справочника", "  Turn this photo into a comic.  ")).toBe(
      "Turn this photo into a comic."
    );
  });

  it("[R-35] режим справочника — как было: тело выбранной версии, без выбора — пусто", () => {
    expect(effectivePrompt("catalog", "body из справочника", "мой текст")).toBe("body из справочника");
    expect(effectivePrompt("catalog", undefined, "мой текст")).toBe("");
  });

  it("[R-35] сравнение — с эталоном, если он есть; у прогона без эталона — с исходником", () => {
    expect(compareTarget({ sourceUrl: "s.jpg", referenceUrl: "r.jpg" })).toEqual({
      url: "r.jpg",
      label: "эталон",
    });
    expect(compareTarget({ sourceUrl: "s.jpg" })).toEqual({ url: "s.jpg", label: "исходник" });
  });

  it("[R-35] «Прогнать без эталона» доступна при фото и промпте, вне лимита и не во время запроса", () => {
    const ok = { hasFile: true, prompt: "comic", overLimit: false, busy: false };
    expect(canStartWithoutReference(ok)).toBe(true);
    expect(canStartWithoutReference({ ...ok, hasFile: false })).toBe(false);
    expect(canStartWithoutReference({ ...ok, prompt: "   " })).toBe(false);
    expect(canStartWithoutReference({ ...ok, overLimit: true })).toBe(false);
    expect(canStartWithoutReference({ ...ok, busy: true })).toBe(false);
  });
});
