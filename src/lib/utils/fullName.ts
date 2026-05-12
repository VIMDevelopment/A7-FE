/** Склейка для бэка: «фамилия имя». */
export function formatFullNameForApi(surname: string, firstName: string): string {
  return [surname.trim(), firstName.trim()].filter(Boolean).join(" ");
}

/** Разбор с бэка: первое слово — фамилия, остальное — имя (и отчество). */
export function parseFullNameFromApi(fullName: string | undefined): {
  surname: string;
  firstName: string;
} {
  const t = fullName?.trim() ?? "";
  if (!t) return { surname: "", firstName: "" };
  const parts = t.split(/\s+/);
  if (parts.length === 1) return { surname: parts[0]!, firstName: "" };
  return { surname: parts[0]!, firstName: parts.slice(1).join(" ") };
}
