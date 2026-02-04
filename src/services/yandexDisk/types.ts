/**
 * Типы для работы с API Яндекс Диска
 */

export interface YandexDiskTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

export interface YandexDiskErrorResponse {
  error: string;
  error_description?: string;
}

export interface YandexDiskUserInfo {
  login: string;
  display_name: string;
  default_email?: string;
  emails?: string[];
}

export interface YandexDiskResource {
  path: string;
  name: string;
  type: "file" | "dir";
  mime_type?: string;
  size?: number;
  created?: string;
  modified?: string;
  preview?: string;
  _embedded?: {
    items: YandexDiskResource[];
  };
}

