/** R-45: что уйдёт при удалении филиала — для окна подтверждения. */
export type ProjectDeletionSummary = { days: number; albums: number; photos: number };

function plural(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

export function describeProjectDeletion(name: string, summary: ProjectDeletionSummary | null): string {
  const head = `Удалить филиал «${name}» безвозвратно?`;
  if (!summary) {
    return `${head} Он будет удалён вместе со всеми днями, альбомами и фото — включая файлы в хранилище и отпечатки лиц.`;
  }
  if (summary.days === 0 && summary.photos === 0) {
    return `${head} В нём нет ни дней, ни фото.`;
  }
  const what =
    `${summary.days} ${plural(summary.days, "день", "дня", "дней")}, ` +
    `${summary.albums} ${plural(summary.albums, "альбом", "альбома", "альбомов")}, ` +
    `${summary.photos} фото`;
  return `${head} Вместе с ним удалятся: ${what} — включая файлы в хранилище и отпечатки лиц. Восстановить будет нельзя.`;
}
