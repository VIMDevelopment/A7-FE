import { readFileSync } from "fs";
import { join } from "path";

// Сторож R-61: модель по умолчанию — только 2К, выбора разрешения в окне «Улучшить» нет;
// тексты справочника категорий и назначения цепочке называют модель из DEFAULT_MODEL_LABEL.
// ЕВА, приёмка 13.10: без него модалка, снова шлющая outputResolution: "4K", и старый текст
// «По умолчанию — nano-banana-pro» в справочнике проходили весь набор зелёным (окно ни один тест не грузит).
const ROOT = process.cwd();
const read = (f: string) => readFileSync(join(ROOT, f), "utf-8");

const MODAL = "src/components/ImprovementModal/ImprovementModal.tsx";
const TEXTS = ["src/pages/Prompts/Prompts.tsx", "src/pages/ModelExplorer/components/BindCategoriesModal.tsx"];

describe("[R-61] модель обработки по умолчанию в вебе", () => {
  it("[R-61] окно «Улучшить»: нет выбора 2К/4К, разрешение в запрос не уходит, тело собирает addLayerPayload", () => {
    const modal = read(MODAL);
    expect(modal).not.toMatch(/outputResolution|<Radio\b|["'`]4K["'`]/);
    expect(modal).toMatch(/addLayerPayload\(/);
  });

  it.each(TEXTS)("[R-61] %s называет модель по умолчанию из DEFAULT_MODEL_LABEL, не nano-banana-pro", (file) => {
    const text = read(file);
    expect(text).not.toMatch(/nano-banana/i);
    expect(text).toMatch(/DEFAULT_MODEL_LABEL/);
  });

  // ЕВА, приёмка 13.10: инструкция в «Базе знаний» обещала выбор «2K или 4K»
  it("[R-61] база знаний не обещает выбор разрешения в окне улучшения", () => {
    const kb = read("src/pages/KnowledgeBase/instructions.ts");
    expect(kb).not.toMatch(/2K или 4K|4K/);
  });
});
