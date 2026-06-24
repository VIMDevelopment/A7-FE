/**
 * Ручной API-модуль для эндпоинтов самостоятельной регистрации и выдачи доступа.
 * Не входит в orval-генерацию (см. orval.config.ts → clean: true), чтобы не сбрасывался
 * при следующей регенерации схемы с прода.
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
import { UserRolesItem } from "../apiV2/a7-service/model";

export type RegisterPublicDto = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  supervisorId: string;
};

export type VerifyEmailDto = {
  email: string;
  code: string;
};

export type ResendCodeDto = {
  email: string;
};

export type GrantAccessDto = {
  roles: UserRolesItem[];
  workplace?: string[];
};

export type PublicSupervisor = {
  id: string;
  name: string;
};

export type PendingUserDto = {
  id: string;
  email: string;
  name: string;
  requestedSupervisor: { id: string; name: string } | null;
  createdAt: string;
};

export type GrantAccessResponse = {
  id: string;
  email: string;
  name: string;
  roles: UserRolesItem[];
  workplace: string[];
};

export type RegisterPublicResponse = { email: string };
export type VerifyEmailResponse = { jwt: string };

export type ApiError = AxiosError<{ message?: string; error?: string }>;

const post = <TBody, TResp>(url: string, body: TBody, axiosOptions?: AxiosRequestConfig) =>
  axios.post<TResp>(url, body, { ...defaultApiAxiosParams, ...axiosOptions });

const patch = <TBody, TResp>(url: string, body: TBody, axiosOptions?: AxiosRequestConfig) =>
  axios.patch<TResp>(url, body, { ...defaultApiAxiosParams, ...axiosOptions });

const get = <TResp>(url: string, axiosOptions?: AxiosRequestConfig) =>
  axios.get<TResp>(url, { ...defaultApiAxiosParams, ...axiosOptions });

// --- Mutations ----------------------------------------------------------

export const usePostUsersRegisterPublic = <TError = ApiError>(
  options?: UseMutationOptions<{ data: RegisterPublicResponse }, TError, RegisterPublicDto>
) =>
  useMutation<{ data: RegisterPublicResponse }, TError, RegisterPublicDto>(
    (data) => post<RegisterPublicDto, RegisterPublicResponse>("/users/register-public", data),
    options
  );

export const usePostUsersVerifyEmail = <TError = ApiError>(
  options?: UseMutationOptions<{ data: VerifyEmailResponse }, TError, VerifyEmailDto>
) =>
  useMutation<{ data: VerifyEmailResponse }, TError, VerifyEmailDto>(
    (data) => post<VerifyEmailDto, VerifyEmailResponse>("/users/verify-email", data),
    options
  );

export const usePostUsersResendCode = <TError = ApiError>(
  options?: UseMutationOptions<{ data: { ok: boolean } }, TError, ResendCodeDto>
) =>
  useMutation<{ data: { ok: boolean } }, TError, ResendCodeDto>(
    (data) => post<ResendCodeDto, { ok: boolean }>("/users/resend-code", data),
    options
  );

export const usePatchUsersGrantAccess = <TError = ApiError>(
  options?: UseMutationOptions<
    { data: GrantAccessResponse },
    TError,
    { id: string; data: GrantAccessDto }
  >
) =>
  useMutation<{ data: GrantAccessResponse }, TError, { id: string; data: GrantAccessDto }>(
    ({ id, data }) => patch<GrantAccessDto, GrantAccessResponse>(`/users/${id}/grant-access`, data),
    options
  );

// --- Queries ------------------------------------------------------------

export const GET_SUPERVISORS_PUBLIC_KEY = ["/supervisors/public"];

export const useGetSupervisorsPublic = <
  TData = { data: PublicSupervisor[] },
  TError = ApiError
>(
  options?: UseQueryOptions<{ data: PublicSupervisor[] }, TError, TData>
): UseQueryResult<TData, TError> =>
  useQuery<{ data: PublicSupervisor[] }, TError, TData>(
    GET_SUPERVISORS_PUBLIC_KEY,
    () => get<PublicSupervisor[]>("/supervisors/public"),
    options
  );

export const GET_USERS_PENDING_KEY = ["/users/pending"];

export const useGetUsersPending = <
  TData = { data: PendingUserDto[] },
  TError = ApiError
>(
  options?: UseQueryOptions<{ data: PendingUserDto[] }, TError, TData>
): UseQueryResult<TData, TError> =>
  useQuery<{ data: PendingUserDto[] }, TError, TData>(
    GET_USERS_PENDING_KEY,
    () => get<PendingUserDto[]>("/users/pending"),
    options
  );
