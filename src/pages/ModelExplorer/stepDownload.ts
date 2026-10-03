import { showNotification } from "../../components/ShowNotification";

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
 * Скачивание картинки шага прямо из бакета (CORS бакетов стенда и прода пускают свои
 * домены; бэкенд не участвует).
 *
 * cache: "no-store" обязателен: миниатюра шага — тот же URL, уже загруженный тегом <img>
 * без CORS. S3 не шлёт `Vary: Origin`, поэтому обычный fetch получает этот ответ из
 * HTTP-кэша без Access-Control-Allow-Origin, и браузер блокирует его по CORS
 * (баг стенда 03.10). Мимо кэша запрос уходит с Origin и получает разрешение.
 */
export async function downloadStepImage(
  imageUrl: string,
  runCreatedAt: string,
  chainTitle: string,
  stepIndex: number,
  model: string
): Promise<void> {
  try {
    const response = await fetch(imageUrl, { mode: "cors", cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const blobUrl = URL.createObjectURL(await response.blob());
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = stepFileName(runCreatedAt, chainTitle, stepIndex, model);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  } catch {
    showNotification({
      type: "error",
      message: "Не удалось скачать картинку — попробуйте ещё раз",
    });
  }
}
