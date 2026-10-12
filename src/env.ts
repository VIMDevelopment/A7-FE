export const ENV = {
  // Адрес API вшивается на этапе сборки (build-arg Dockerfile: стенд/прод). Имя переменной
  // оставлено от CRA (Vite: envPrefix REACT_APP_) — чтобы не менять buildArgs в Dokploy (R-54).
  REACT_APP_API_URL: import.meta.env.REACT_APP_API_URL ?? "https://api.wanmax.io",
};
