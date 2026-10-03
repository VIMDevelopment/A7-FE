import { downloadImageByUrl } from "../Album/components/PhotoCard/helpers";

const pad = (n: number) => String(n).padStart(2, "0");

/** Символы, запрещённые в именах файлов Windows/macOS, → «-»; пробелы схлопываются. */
const safe = (value: string) =>
  value
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Имя скачиваемой картинки шага (R-37.3): дата и время прогона (локальные), цепочка,
 * номер шага, модель — файлы разных цепочек и прогонов не путаются.
 */
export function stepFileName(
  runCreatedAt: string,
  chainTitle: string,
  stepIndex: number,
  model: string
): string {
  const d = new Date(runCreatedAt);
  const stamp = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(
    d.getHours()
  )}-${pad(d.getMinutes())}`;
  const shortModel = model.split("/")[1] ?? model;
  return `${stamp}_${safe(chainTitle)}_шаг-${stepIndex + 1}_${safe(shortModel)}.jpg`;
}

/**
 * Скачивание картинки шага прямо из бакета — тем же способом, что фото альбома
 * (CORS бакетов стенда и прода пускают свои домены; бэкенд не участвует).
 */
export function downloadStepImage(
  imageUrl: string,
  runCreatedAt: string,
  chainTitle: string,
  stepIndex: number,
  model: string
): Promise<void> {
  return downloadImageByUrl(imageUrl, stepFileName(runCreatedAt, chainTitle, stepIndex, model));
}
