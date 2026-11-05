import { deletionFailedMessage, splitDeletion } from "./photoDeletion";

const ok = (): PromiseSettledResult<unknown> => ({ status: "fulfilled", value: {} });
const fail = (status?: number): PromiseSettledResult<unknown> => ({
  status: "rejected",
  reason: status ? { response: { status } } : new Error("Network Error"),
});

describe("[R-66.3] удаление фото в окне альбома — что удалилось, что осталось", () => {
  it("[R-66.3] облако не удалило часть фото («не завершено») — они остаются к повтору, остальные удалены", () => {
    const { deleted, failed } = splitDeletion(["p1", "p2", "p3"], [ok(), fail(502), fail()]);
    expect([...deleted]).toEqual(["p1"]);
    expect(failed).toEqual(["p2", "p3"]);
  });

  it("[R-66.3] фото уже удалено (404 при повторе) — считается удалённым, а не ошибкой", () => {
    const { deleted, failed } = splitDeletion(["p1"], [fail(404)]);
    expect([...deleted]).toEqual(["p1"]);
    expect(failed).toEqual([]);
  });

  it("[R-66.3] сотрудник видит, что удаление не прошло, и что его можно повторить", () => {
    expect(deletionFailedMessage(2)).toBe("Удаление не завершено: 2 фото осталось. Нажмите «Удалить» ещё раз");
  });
});
