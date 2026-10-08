import type { PromptResponse } from "../../apiV2/a7-service/model";
import { defaultPromptOf, promptBodyOf } from "../../components/prompts/promptCatalog";

/**
 * Выбор промпта в Explorer — тот же принцип, что в модалке улучшения фото:
 * избранные категории филиала сверху (по title), остальные в порядке бэкенда;
 * текст прогона = текст выбранного промпта категории (R-38).
 */
export function sortPromptsByFavorites(
  prompts: PromptResponse[],
  favoriteIds: Set<string>
): PromptResponse[] {
  return [
    ...prompts
      .filter((p) => favoriteIds.has(p.id ?? ""))
      .sort((a, b) => (a.title ?? "").localeCompare(b.title ?? "")),
    ...prompts.filter((p) => !favoriteIds.has(p.id ?? "")),
  ];
}

/** Текст прогона — только выбранного промпта категории (R-38.5, общее правило с модалкой). */
export const resolvePromptBody = promptBodyOf;

/** Дефолт промпта при выборе категории: один — он сам, несколько — выбирает человек (R-38.5). */
export const defaultVersionOf = defaultPromptOf;
