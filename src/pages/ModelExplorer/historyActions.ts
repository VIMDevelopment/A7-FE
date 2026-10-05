import type { ExplorerRun } from "../../api/explorerApi";

/**
 * Кнопка «Удалить» в истории (R-36): только админ и только у завершённого прогона —
 * выполняющийся сервер всё равно не даст удалить (его ещё пишут цепочки).
 */
export function canDeleteRun(run: Pick<ExplorerRun, "status">, isAdmin: boolean): boolean {
  return isAdmin && run.status !== "running";
}
