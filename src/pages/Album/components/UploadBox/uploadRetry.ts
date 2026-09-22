// R-34: загрузка фото по плохой сети (боевой случай 21.09 — сотрудница из Чили,
// обрывы multipart показывались как «Произошла ошибка на сервере»).
// Сеть/таймаут/5xx/408/429 — повторяем с нарастающей паузой; прочие 4xx — нет:
// клиентскую ошибку (не изображение, слишком большой) ретраить бессмысленно.

/** Таймаут одного аплоада: файл после ресайза — мегабайты, канал бывает 1 Мбит. */
export const UPLOAD_TIMEOUT_MS = 120_000;

/** Паузы между попытками: всего 1 + delays.length попыток. */
export const UPLOAD_RETRY_DELAYS_MS = [2_000, 5_000];

export type UploadFailure = {
  kind: "network" | "server-message";
  serverMessage?: string;
};

type AxiosLikeError = {
  response?: { status?: number; data?: { message?: string } };
};

/** Ретраебельность по виду ошибки; текст сервера сохраняем, если он был. */
export function classifyUploadError(err: unknown): {
  retryable: boolean;
  failure: UploadFailure;
} {
  const response = (err as AxiosLikeError)?.response;
  const status = response?.status;
  const serverMessage = response?.data?.message;

  const isClientError =
    typeof status === "number" &&
    status >= 400 &&
    status < 500 &&
    status !== 408 && // Request Timeout — сетевой по природе
    status !== 429; // Too Many Requests — пройдёт после паузы

  if (isClientError) {
    return { retryable: false, failure: { kind: "server-message", serverMessage } };
  }
  // Нет ответа (обрыв/таймаут) или 5xx/408/429 — виновата дорога, не запрос.
  return { retryable: true, failure: { kind: "network", serverMessage } };
}

export type UploadRetryResult =
  | { ok: true; attempts: number }
  | { ok: false; attempts: number; failure: UploadFailure };

export async function uploadWithRetry(
  attempt: () => Promise<unknown>,
  sleep: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms)),
  delays: number[] = UPLOAD_RETRY_DELAYS_MS
): Promise<UploadRetryResult> {
  let lastFailure: UploadFailure = { kind: "network" };
  for (let i = 0; i <= delays.length; i++) {
    try {
      await attempt();
      return { ok: true, attempts: i + 1 };
    } catch (err) {
      const { retryable, failure } = classifyUploadError(err);
      if (!retryable) {
        return { ok: false, attempts: i + 1, failure };
      }
      lastFailure = failure;
      if (i < delays.length) {
        await sleep(delays[i]);
      }
    }
  }
  return { ok: false, attempts: delays.length + 1, failure: lastFailure };
}

/** Текст финального тоста: причина по-человечески, без вранья про «сервер». */
export function uploadFailureToast(
  fileName: string,
  failure: UploadFailure
): { message: string; description?: string } {
  if (failure.kind === "server-message" && failure.serverMessage) {
    return {
      message: `Не удалось загрузить ${fileName}`,
      description: failure.serverMessage,
    };
  }
  return {
    message: `Не удалось отправить ${fileName}`,
    description:
      "Похоже, проблема с интернет-соединением. Проверьте связь и попробуйте ещё раз.",
  };
}
