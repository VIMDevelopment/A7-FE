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
});
