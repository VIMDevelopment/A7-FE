/**
 * Ручной API-модуль избранных промптов по филиалу.
 * Не входит в orval-генерацию (orval.config.ts → clean: true), чтобы не сбрасывался
 * при регенерации схемы с прода (эндпоинты ещё не задеплоены в prod OpenAPI).
 */
import axios, { AxiosError, AxiosRequestConfig } from "axios";
import {
  useMutation,
  useQuery,
  UseMutationOptions,
  UseQueryOptions,
  UseQueryResult,
} from "react-query";
import { defaultApiAxiosParams } from "./helpers";

export type FavoritePromptDto = {
  projectId: string;
  promptId: string;
};

export type FavoritesResponse = { promptIds: string[] };
export type OkResponse = { ok: boolean };

export type ApiError = AxiosError<{ message?: string; error?: string }>;

const post = <TBody, TResp>(url: string, body: TBody, axiosOptions?: AxiosRequestConfig) =>
  axios.post<TResp>(url, body, { ...defaultApiAxiosParams, ...axiosOptions });

const del = <TBody, TResp>(url: string, body: TBody, axiosOptions?: AxiosRequestConfig) =>
  axios.delete<TResp>(url, { ...defaultApiAxiosParams, ...axiosOptions, data: body });

const get = <TResp>(url: string, axiosOptions?: AxiosRequestConfig) =>
  axios.get<TResp>(url, { ...defaultApiAxiosParams, ...axiosOptions });

// Ключ кэша react-query: завязан на филиал, чтобы инвалидировать точечно.
export const getFavoritePromptsKey = (projectId?: string) => [
  "/favorites",
  projectId ?? "",
];

export const useGetFavoritePrompts = <
  TData = { data: FavoritesResponse },
  TError = ApiError
>(
  projectId: string | undefined,
  options?: UseQueryOptions<{ data: FavoritesResponse }, TError, TData>
): UseQueryResult<TData, TError> =>
  useQuery<{ data: FavoritesResponse }, TError, TData>(
    getFavoritePromptsKey(projectId),
    () =>
      get<FavoritesResponse>(
        `/favorites?projectId=${encodeURIComponent(projectId ?? "")}`
      ),
    options
  );

export const usePostFavoritePrompt = <TError = ApiError>(
  options?: UseMutationOptions<{ data: OkResponse }, TError, FavoritePromptDto>
) =>
  useMutation<{ data: OkResponse }, TError, FavoritePromptDto>(
    (data) => post<FavoritePromptDto, OkResponse>("/favorites", data),
    options
  );

export const useDeleteFavoritePrompt = <TError = ApiError>(
  options?: UseMutationOptions<{ data: OkResponse }, TError, FavoritePromptDto>
) =>
  useMutation<{ data: OkResponse }, TError, FavoritePromptDto>(
    (data) => del<FavoritePromptDto, OkResponse>("/favorites", data),
    options
  );
