import { describeCostTotal } from "./costTotal";

describe("describeCostTotal", () => {
  it("[R-42] курс задан — сумма в рублях", () => {
    const view = describeCostTotal({ totalRub: 45, totalUsd: 0.45, rateMissing: false });
    expect(view.value.replace(/\s/g, " ")).toBe("45 ₽");
    expect(view.warning).toBeUndefined();
  });

  it("[R-42] курс не задан — сумма в долларах и пометка, а не «0 ₽»", () => {
    const view = describeCostTotal({ totalRub: null, totalUsd: 12.3, rateMissing: true });
    expect(view.value).toBe("$12.30");
    expect(view.warning).toMatch(/курс USD\/RUB не задан/i);
  });

  it("[R-42] старый бэк без новых полей — как раньше, в рублях", () => {
    const view = describeCostTotal({ totalRub: 7 });
    expect(view.value.replace(/\s/g, " ")).toBe("7 ₽");
  });

  it("[R-42] отчёта ещё нет — 0 ₽", () => {
    expect(describeCostTotal(undefined).value.replace(/\s/g, " ")).toBe("0 ₽");
  });

  it("[R-42.10] рубли — с курсом и его датой по Москве: застывший курс виден глазами", () => {
    const view = describeCostTotal({
      totalRub: 39,
      totalUsd: 0.45,
      rateMissing: false,
      usdRub: 85,
      rateUpdatedAt: "2026-08-02T22:00:00.051Z",
    });
    expect(view.rateNote?.replace(/\s/g, " ")).toBe("Курс 85 ₽ за $1 от 03.08.2026");
  });

  it("[R-42.10] курс с копейками — с копейками", () => {
    const view = describeCostTotal({ totalRub: 40, totalUsd: 0.45, usdRub: 87.05, rateUpdatedAt: "2026-11-02T16:40:00.000Z" });
    expect(view.rateNote?.replace(/\s/g, " ")).toBe("Курс 87,05 ₽ за $1 от 02.11.2026");
  });

  it("[R-42.10] курса в отчёте нет (только рубли или старый бэк) — строки курса нет", () => {
    expect(describeCostTotal({ totalRub: 7 }).rateNote).toBeUndefined();
    expect(describeCostTotal({ totalRub: null, totalUsd: 1, rateMissing: true }).rateNote).toBeUndefined();
  });
});
