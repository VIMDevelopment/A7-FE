import type { PromptResponse } from "../../apiV2/a7-service/model";

/**
 * Справочник промптов (R-38): запись справочника = КАТЕГОРИЯ («Комикс»), её history =
 * ПРОМПТЫ внутри («Страница», «Значок»). Хранение и API прежние — десктоп на точках
 * синхронизирует справочник с прода и работает без нового релиза (R-38.7).
 */

/**
 * Какой промпт подставить после выбора категории (R-38.5): один промпт — он сам;
 * несколько — никакой, выбирает человек (это разные эффекты, а не версии одного).
 */
export function defaultPromptOf(category: PromptResponse | undefined): string | null {
  const prompts = category?.history ?? [];
  return prompts.length === 1 ? prompts[0].promptVersion ?? null : null;
}

/** Текст для нейросети — только у выбранного промпта; body категории не отправляется. */
export function promptBodyOf(
  category: PromptResponse | undefined,
  promptName: string | null
): string | undefined {
  if (!category || promptName == null) return undefined;
  const found = (category.history ?? []).find((h) => h.promptVersion === promptName);
  return found?.promptBody ?? undefined;
}

/** Проверка имени нового промпта в категории (R-38.3): не пустое и уникальное. */
export function validateNewPromptName(
  category: PromptResponse | undefined,
  rawName: string
): string | null {
  const name = rawName.trim();
  if (!name) return "Введите название промпта";
  if ((category?.history ?? []).some((h) => h.promptVersion === name)) {
    return `Промпт «${name}» уже есть в категории «${category?.title ?? ""}»`;
  }
  return null;
}

/** Имя новой категории (R-38.2): не пустое и уникальное — без учёта регистра и пробелов. */
export function validateNewCategoryName(
  categories: PromptResponse[],
  rawName: string
): string | null {
  const name = rawName.trim();
  if (!name) return "Введите название категории";
  const key = name.toLowerCase();
  const clash = categories.find((c) => (c.title ?? "").trim().toLowerCase() === key);
  return clash ? `Категория «${clash.title}» уже есть` : null;
}

/** Фотографу (модалка, Explorer) — только категории с промптами: в пустой применять нечего (R-38.5). */
export function categoriesWithPrompts(categories: PromptResponse[]): PromptResponse[] {
  return categories.filter((c) => (c.history ?? []).length > 0);
}
