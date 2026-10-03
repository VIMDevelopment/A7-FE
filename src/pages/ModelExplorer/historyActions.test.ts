import { canDeleteRun } from "./historyActions";

describe("Explorer: удаление прогона из истории [R-36]", () => {
  it("[R-36] админ может удалить завершённый прогон (done / partial / failed)", () => {
    for (const status of ["done", "partial", "failed"] as const) {
      expect(canDeleteRun({ status }, true)).toBe(true);
    }
  });

  it("[R-36] выполняющийся прогон удалить нельзя", () => {
    expect(canDeleteRun({ status: "running" }, true)).toBe(false);
  });

  it("[R-36] руководитель (не админ) кнопки удаления не видит", () => {
    expect(canDeleteRun({ status: "done" }, false)).toBe(false);
  });
});
