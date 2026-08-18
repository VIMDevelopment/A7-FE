/**
 * Ручной API-модуль Model Explorer (R-11…R-16).
 * Не входит в orval-генерацию (orval.config.ts → clean: true): эндпоинты /explorer
 * появятся в прод-OpenAPI только после деплоя BE.
 */
import axios, { AxiosRequestConfig } from "axios";
import {
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from "react-query";
import { defaultApiAxiosParams } from "./helpers";

export type ExplorerResolution = "2K" | "4K";

export type ExplorerConfigResponse = {
  reference: { model: string; priceUsd: Record<ExplorerResolution, number> };
  chains: Array<{
    id: string;
    title: string;
    estimateUsd: Record<ExplorerResolution, number>;
    steps: Record<
      ExplorerResolution,
      Array<{ model: string; kind: "generative" | "upscale"; priceUsd: number }>
    >;
  }>;
  estimateUsd: Record<ExplorerResolution, number>;
  limitUsd: number;
};

export type ExplorerReference = {
  id: string;
  prompt: string;
  resolution: ExplorerResolution;
  sourceUrl: string;
  resultUrl: string;
  costUsd: number;
  createdAt: string;
};

export type ExplorerStep = {
  model: string;
  version: string;
  kind: "generative" | "upscale";
  status: "pending" | "running" | "done" | "failed" | "skipped";
  estimateUsd: number;
  factUsd?: number;
  imageUrl?: string;
  error?: string;
  cached?: boolean;
};

export type ExplorerChain = {
  chainId: string;
  title: string;
  status: "pending" | "running" | "done" | "failed";
  steps: ExplorerStep[];
  factUsd?: number;
  error?: string;
};

export type ExplorerRun = {
  id: string;
  createdAt: string;
  createdBy: string;
  prompt: string;
  resolution: ExplorerResolution;
  status: "running" | "done" | "partial" | "failed";
  referenceId: string;
  sourceUrl: string;
  referenceUrl: string;
  estimateUsd: number;
  factUsd?: number;
  chains: ExplorerChain[];
};

export type ExplorerRunListItem = Pick<
  ExplorerRun,
  | "id"
  | "createdAt"
  | "createdBy"
  | "prompt"
  | "resolution"
  | "status"
  | "estimateUsd"
  | "factUsd"
  | "sourceUrl"
>;

const get = <TResp>(url: string, axiosOptions?: AxiosRequestConfig) =>
  axios.get<TResp>(url, { ...defaultApiAxiosParams, ...axiosOptions });

const post = <TBody, TResp>(
  url: string,
  body: TBody,
  axiosOptions?: AxiosRequestConfig
) => axios.post<TResp>(url, body, { ...defaultApiAxiosParams, ...axiosOptions });

export const explorerConfigKey = ["/explorer/config"];
export const explorerRunsKey = ["/explorer/runs"];
export const explorerRunKey = (id?: string) => ["/explorer/runs", id ?? ""];

export const useExplorerConfig = (
  options?: UseQueryOptions<ExplorerConfigResponse>
) =>
  useQuery<ExplorerConfigResponse>(
    explorerConfigKey,
    () => get<ExplorerConfigResponse>("/explorer/config").then((r) => r.data),
    options
  );

export const useExplorerRuns = (
  options?: UseQueryOptions<{ runs: ExplorerRunListItem[] }>
) =>
  useQuery<{ runs: ExplorerRunListItem[] }>(
    explorerRunsKey,
    () =>
      get<{ runs: ExplorerRunListItem[] }>("/explorer/runs").then((r) => r.data),
    options
  );

export const useExplorerRun = (
  id?: string,
  options?: UseQueryOptions<{ run: ExplorerRun }>
) =>
  useQuery<{ run: ExplorerRun }>(
    explorerRunKey(id),
    () => get<{ run: ExplorerRun }>(`/explorer/runs/${id}`).then((r) => r.data),
    { enabled: Boolean(id), ...options }
  );

export type CreateReferenceArgs = {
  photo: File;
  prompt: string;
  resolution: ExplorerResolution;
  force?: boolean;
};

export type CreateReferenceResponse = {
  reference: ExplorerReference;
  cached: boolean;
  costUsd: number;
};

export const useCreateReference = (
  options?: UseMutationOptions<CreateReferenceResponse, unknown, CreateReferenceArgs>
) =>
  useMutation<CreateReferenceResponse, unknown, CreateReferenceArgs>(
    async ({ photo, prompt, resolution, force }) => {
      const form = new FormData();
      form.append("photo", photo);
      form.append("prompt", prompt);
      form.append("resolution", resolution);
      if (force) form.append("force", "true");
      const { data } = await post<FormData, CreateReferenceResponse>(
        "/explorer/references",
        form,
        { headers: { ...defaultApiAxiosParams.headers, "Content-Type": "multipart/form-data" } }
      );
      return data;
    },
    options
  );

export type StartRunArgs = { referenceId: string; confirmEstimateUsd: number };

export const useStartRun = (
  options?: UseMutationOptions<{ run: ExplorerRun }, unknown, StartRunArgs>
) =>
  useMutation<{ run: ExplorerRun }, unknown, StartRunArgs>(
    (body) =>
      post<StartRunArgs, { run: ExplorerRun }>("/explorer/runs", body).then(
        (r) => r.data
      ),
    options
  );
