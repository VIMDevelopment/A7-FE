export const ENV = {
  // CRA инлайнит process.env.REACT_APP_* на этапе build: прод-fallback остаётся,
  // но build-arg Dockerfile (стенд) и локальный dev-запуск теперь РЕАЛЬНО работают —
  // раньше значение было захардкожено и все сборки били в прод-API.
  REACT_APP_API_URL: process.env.REACT_APP_API_URL ?? "https://api.wanmax.io",
};
