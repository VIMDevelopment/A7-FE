import { globalErrorMessage } from "./globalErrorMessage";

// R-34 (критерий 5): глобальная заглушка различает «нет связи» и «сервер».
// Раньше любой обрыв соединения показывался как «Произошла ошибка на сервере» —
// сотрудница из Чили решила, что упала платформа (21.09).
describe("globalErrorMessage (R-34)", () => {
  it("[R-34] нет ответа сервера → «Нет связи с сервером…»", () => {
    expect(globalErrorMessage(new Error("Network Error"))).toBe(
      "Нет связи с сервером — проверьте интернет-соединение"
    );
  });

  it("[R-34] сервер вернул message → показываем его", () => {
    const err = { response: { status: 422, data: { message: "Название занято" } } };
    expect(globalErrorMessage(err)).toBe("Название занято");
  });

  it("[R-34] ответ сервера без message → прежняя заглушка про сервер", () => {
    const err = { response: { status: 500, data: {} } };
    expect(globalErrorMessage(err)).toBe("Произошла ошибка на сервере");
  });
});
