/**
 * Привязка категории справочника к цепочке обработки (R-39): хранится в документе категории
 * (`processing`), назначается админом через /explorer/categories/:id/processing.
 * Ручной модуль, как explorerApi: в orval-генерации этих типов нет.
 */
import axios, { AxiosRequestConfig } from "axios";
import { useMutation, UseMutationOptions } from "react-query";
import { defaultApiAxiosParams } from "./helpers";
import type { PromptResponse } from "../apiV2/a7-service/model";

export type CategoryProcessingStep = {
  model: string;
  kind: "generative" | "upscale";
  resolution?: "2K" | "4K";
  estimateUsd: number;
};

export type CategoryProcessing = {
  chainId: string;
  chainTitle: string;
  steps: CategoryProcessingStep[];
  /** оценка за одно фото, USD */
  estimateUsd: number;
  boundAt: string;
  boundBy: string;
};

/** Категория справочника с привязкой (поле приходит в /prompts, в orval-типе его нет). */
export type CategoryWithProcessing = PromptResponse & {
  processing?: CategoryProcessing | null;
};

export type BindCategoryArgs = { categoryId: string; chainId: string };

export const useBindCategory = (
  options?: UseMutationOptions<{ processing: CategoryProcessing }, unknown, BindCategoryArgs>
) =>
  useMutation<{ processing: CategoryProcessing }, unknown, BindCategoryArgs>(
    ({ categoryId, chainId }) =>
      axios
        .put<{ processing: CategoryProcessing }>(
          `/explorer/categories/${categoryId}/processing`,
          { chainId },
          defaultApiAxiosParams as AxiosRequestConfig
        )
        .then((r) => r.data),
    options
  );

export const useUnbindCategory = (
  options?: UseMutationOptions<{ ok: boolean }, unknown, string>
) =>
  useMutation<{ ok: boolean }, unknown, string>(
    (categoryId) =>
      axios
        .delete<{ ok: boolean }>(
          `/explorer/categories/${categoryId}/processing`,
          defaultApiAxiosParams as AxiosRequestConfig
        )
        .then((r) => r.data),
    options
  );
