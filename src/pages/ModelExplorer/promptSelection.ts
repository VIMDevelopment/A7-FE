import type { PromptResponse } from "../../apiV2/a7-service/model";

/**
 * Выбор промпта в Explorer — тот же принцип, что в модалке улучшения фото:
 * избранные филиала сверху (по title), остальные в порядке бэкенда;
 * тело запроса = тело выбранной версии из history, fallback — body промпта.
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

export function resolvePromptBody(
  prompt: PromptResponse | undefined,
  selectedVersion: string | null
): string | undefined {
  if (!prompt) return undefined;
  const history = prompt.history ?? [];
  if (selectedVersion != null) {
    const item = history.find((h) => h.promptVersion === selectedVersion);
    if (item?.promptBody != null) return item.promptBody;
  }
  return prompt.body ?? undefined;
}

/** Дефолт версии при выборе промпта — последняя запись history (как в модалке). */
export function defaultVersionOf(prompt: PromptResponse | undefined): string | null {
  const history = prompt?.history ?? [];
  return history.length > 0 ? history[history.length - 1].promptVersion ?? null : null;
}
