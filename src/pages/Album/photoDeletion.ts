const statusOf = (reason: unknown): number | undefined =>
  (reason as { response?: { status?: number } } | undefined)?.response?.status;

export function splitDeletion(
  ids: string[],
  results: PromiseSettledResult<unknown>[]
): { deleted: Set<string>; failed: string[] } {
  const deleted = new Set<string>();
  const failed: string[] = [];
  ids.forEach((id, i) => {
    const result = results[i];
    if (result?.status === "fulfilled" || statusOf(result?.reason) === 404) deleted.add(id);
    else failed.push(id);
  });
  return { deleted, failed };
}

export const deletionFailedMessage = (count: number): string =>
  `Удаление не завершено: ${count} фото осталось. Нажмите «Удалить» ещё раз`;
