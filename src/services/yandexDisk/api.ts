import axios, { AxiosInstance } from "axios";
import { ENV } from "../../env";
import {
  YandexDiskTokenResponse,
  YandexDiskErrorResponse,
  YandexDiskUserInfo,
  YandexDiskResource,
} from "./types";

/**
 * Константы для OAuth Яндекс Диска
 */
const YANDEX_OAUTH_URL = "https://oauth.yandex.ru";
const YANDEX_DISK_API_URL = "https://cloud-api.yandex.net/v1";

/**
 * Получить токен доступа из localStorage
 */
export const getYandexDiskToken = (): string | null => {
  return localStorage.getItem("yandex_disk_access_token");
};

/**
 * Сохранить токен доступа в localStorage
 */
export const setYandexDiskToken = (token: string): void => {
  localStorage.setItem("yandex_disk_access_token", token);
};

/**
 * Удалить токен доступа из localStorage
 */
export const removeYandexDiskToken = (): void => {
  localStorage.removeItem("yandex_disk_access_token");
  localStorage.removeItem("yandex_disk_refresh_token");
};

/**
 * Проверить, авторизован ли пользователь
 */
export const isYandexDiskAuthorized = (): boolean => {
  return !!getYandexDiskToken();
};

/**
 * Получить URL для OAuth авторизации
 */
export const getYandexDiskAuthUrl = (): string => {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: ENV.REACT_APP_YANDEX_DISK_CLIENT_ID,
    redirect_uri: ENV.REACT_APP_YANDEX_DISK_REDIRECT_URI,
  });

  return `${YANDEX_OAUTH_URL}/authorize?${params.toString()}`;
};

/**
 * Обменять код авторизации на токен
 */
export const exchangeCodeForToken = async (
  code: string
): Promise<YandexDiskTokenResponse> => {
  try {
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: ENV.REACT_APP_YANDEX_DISK_CLIENT_ID,
      client_secret: ENV.REACT_APP_YANDEX_DISK_CLIENT_SECRET,
    });

    const response = await axios.post<YandexDiskTokenResponse>(
      `${YANDEX_OAUTH_URL}/token`,
      params.toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    if (response.data.access_token) {
      setYandexDiskToken(response.data.access_token);
      if (response.data.refresh_token) {
        localStorage.setItem("yandex_disk_refresh_token", response.data.refresh_token);
      }
    }

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const errorData = error.response.data as YandexDiskErrorResponse;
      throw new Error(errorData.error_description || errorData.error || "Ошибка получения токена");
    }
    throw error;
  }
};

/**
 * Создать экземпляр axios для запросов к API Яндекс Диска
 */
const createYandexDiskApiClient = (): AxiosInstance => {
  const token = getYandexDiskToken();
  
  if (!token) {
    throw new Error("Токен доступа не найден. Необходима авторизация.");
  }

  return axios.create({
    baseURL: YANDEX_DISK_API_URL,
    headers: {
      Authorization: `OAuth ${token}`,
      "Content-Type": "application/json",
    },
  });
};

/**
 * Получить информацию о пользователе
 */
export const getYandexDiskUserInfo = async (): Promise<YandexDiskUserInfo> => {
  const client = createYandexDiskApiClient();
  const response = await client.get<YandexDiskUserInfo>("/disk");
  return response.data;
};

/**
 * Получить список ресурсов (файлов и папок)
 */
export const getYandexDiskResources = async (
  path?: string,
  limit?: number,
  offset?: number
): Promise<YandexDiskResource> => {
  const client = createYandexDiskApiClient();
  const response = await client.get<YandexDiskResource>("/disk/resources", {
    params: {
      path: path ?? "/",
      limit: limit ?? 20,
      offset: offset ?? 0,
    },
  });
  return response.data;
};

/**
 * Отключить Яндекс Диск (удалить токен)
 */
export const disconnectYandexDisk = (): void => {
  removeYandexDiskToken();
};

