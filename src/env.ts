export const ENV = {
  REACT_APP_API_URL: "https://api.boml.ru/",
  REACT_APP_YANDEX_DISK_CLIENT_ID: process.env.REACT_APP_YANDEX_DISK_CLIENT_ID || "",
  REACT_APP_YANDEX_DISK_CLIENT_SECRET: process.env.REACT_APP_YANDEX_DISK_CLIENT_SECRET || "",
  REACT_APP_YANDEX_DISK_REDIRECT_URI:
    process.env.REACT_APP_YANDEX_DISK_REDIRECT_URI ||
    (typeof window !== "undefined" ? `${window.location.origin}/disk/auth/callback` : ""),
};
