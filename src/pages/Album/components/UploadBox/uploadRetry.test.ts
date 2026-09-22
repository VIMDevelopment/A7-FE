import {
  classifyUploadError,
  uploadWithRetry,
  uploadFailureToast,
  UPLOAD_RETRY_DELAYS_MS,
} from "./uploadRetry";

// R-34: веб-загрузка фото переживает плохую сеть (боевой случай 21.09: сотрудница из
// Чили — обрывы multipart давали «Произошла ошибка на сервере», хотя сервер ни при чём).
// Сеть/5xx — до 3 попыток с нарастающей паузой; 4xx — без повторов (клиентская ошибка);
// тексты называют причину по-человечески, без вранья про сервер.

const networkError = () => Object.assign(new Error("Network Error"), {});
const httpError = (status: number, message?: string) =>
  Object.assign(new Error(`HTTP ${status}`), {
    response: { status, data: message ? { message } : {} },
  });

describe("uploadWithRetry (R-34)", () => {
  it("[R-34] сетевой обрыв ретраится и успех со второй попытки — без ошибки наружу", async () => {
    const sleep = jest.fn().mockResolvedValue(undefined);
    const attempt = jest
      .fn()
      .mockRejectedValueOnce(networkError())
      .mockResolvedValueOnce(undefined);

    const res = await uploadWithRetry(attempt, sleep);

    expect(res).toEqual({ ok: true, attempts: 2 });
    expect(sleep).toHaveBeenCalledWith(UPLOAD_RETRY_DELAYS_MS[0]);
  });

  it("[R-34] 5xx ретраится; все попытки исчерпаны → ok:false с сетевой причиной", async () => {
    const sleep = jest.fn().mockResolvedValue(undefined);
    const attempt = jest.fn().mockRejectedValue(httpError(502));

    const res = await uploadWithRetry(attempt, sleep);

    expect(attempt).toHaveBeenCalledTimes(UPLOAD_RETRY_DELAYS_MS.length + 1);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.failure.kind).toBe("network");
  });

  it("[R-34] 4xx с текстом сервера — БЕЗ повторов, текст сохраняется", async () => {
    const sleep = jest.fn();
    const attempt = jest
      .fn()
      .mockRejectedValue(httpError(422, "Файл не является изображением"));

    const res = await uploadWithRetry(attempt, sleep);

    expect(attempt).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
    expect(res).toEqual({
      ok: false,
      attempts: 1,
      failure: { kind: "server-message", serverMessage: "Файл не является изображением" },
    });
  });
});

describe("classifyUploadError (R-34)", () => {
  it("[R-34] без ответа сервера (обрыв/таймаут) → ретраебельно", () => {
    expect(classifyUploadError(networkError()).retryable).toBe(true);
  });

  it("[R-34] 408/429 → ретраебельно, прочие 4xx → нет", () => {
    expect(classifyUploadError(httpError(408)).retryable).toBe(true);
    expect(classifyUploadError(httpError(429)).retryable).toBe(true);
    expect(classifyUploadError(httpError(400)).retryable).toBe(false);
    expect(classifyUploadError(httpError(413)).retryable).toBe(false);
  });
});

describe("uploadFailureToast (R-34)", () => {
  it("[R-34] сетевая причина — про соединение, без «ошибки на сервере»", () => {
    const t = uploadFailureToast("3146 (1).jpg", { kind: "network" });
    expect(t.message).toBe("Не удалось отправить 3146 (1).jpg");
    expect(t.description).toContain("интернет-соединением");
    expect(JSON.stringify(t)).not.toMatch(/ошибка на сервере/i);
  });

  it("[R-34] осмысленный ответ сервера — его текст", () => {
    const t = uploadFailureToast("a.jpg", {
      kind: "server-message",
      serverMessage: "Файл слишком большой",
    });
    expect(t.message).toBe("Не удалось загрузить a.jpg");
    expect(t.description).toBe("Файл слишком большой");
  });
});
