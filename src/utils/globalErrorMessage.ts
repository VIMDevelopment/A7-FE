// R-34 (критерий 5): глобальный текст ошибки различает «нет связи» и «сервер».
// Раньше любой обрыв соединения подписывался «Произошла ошибка на сервере» —
// на медленных каналах это сеяло панику про «упавшую платформу» (боевой случай 21.09).
export function globalErrorMessage(err: unknown): string {
  const response = (err as { response?: { data?: { message?: string } } })?.response;
  if (!response) {
    return "Нет связи с сервером — проверьте интернет-соединение";
  }
  return response.data?.message ?? "Произошла ошибка на сервере";
}
