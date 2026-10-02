import type { ExplorerRun } from "../../api/explorerApi";

/** Откуда берётся промпт прогона: общий справочник или свой текст (R-35.4). */
export type PromptSource = "catalog" | "own";

/**
 * Итоговый текст промпта для эталона/прогона. Свой текст уходит дословно —
 * без справочника и без перевода GigaChat (тот живёт только в справочнике).
 */
export function effectivePrompt(
  source: PromptSource,
  catalogBody: string | undefined,
  ownText: string
): string {
  return (source === "own" ? ownText : catalogBody ?? "").trim();
}

/** С чем сравнивать результат цепочки: эталон, а у прогона без эталона — исходник (R-35.2). */
export function compareTarget(
  run: Pick<ExplorerRun, "sourceUrl" | "referenceUrl">
): { url: string; label: "эталон" | "исходник" } {
  return run.referenceUrl
    ? { url: run.referenceUrl, label: "эталон" }
    : { url: run.sourceUrl, label: "исходник" };
}

/** Доступность кнопки «Прогнать без эталона» (R-35.1). */
export function canStartWithoutReference(state: {
  hasFile: boolean;
  prompt: string;
  overLimit: boolean;
  busy: boolean;
}): boolean {
  return state.hasFile && state.prompt.trim().length > 0 && !state.overLimit && !state.busy;
}
