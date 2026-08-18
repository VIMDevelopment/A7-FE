import React, { FC, useState } from "react";
import { Tooltip } from "antd";
import { StarFilled, StarOutlined } from "@ant-design/icons";
import cn from "classnames";
import { useQueryClient } from "react-query";
import Select from "../../../components/Select/Select";
import { useGetPrompts } from "../../../apiV2/a7-service";
import { defaultApiAxiosParams } from "../../../api/helpers";
import { useProfile } from "../../../auth/auth";
import {
  getFavoritePromptsKey,
  useDeleteFavoritePrompt,
  useGetFavoritePrompts,
  usePostFavoritePrompt,
} from "../../../api/favoritesApi";
import { showNotification } from "../../../components/ShowNotification";
import type { PromptResponseHistoryItem } from "../../../apiV2/a7-service/model/promptResponseHistoryItem";
import {
  defaultVersionOf,
  resolvePromptBody,
  sortPromptsByFavorites,
} from "../promptSelection";
import css from "../index.module.css";

type Props = {
  disabled?: boolean;
  /** отдаёт наверх итоговое тело промпта (или undefined, пока не выбран) */
  onPromptBodyChange: (body: string | undefined) => void;
};

/**
 * Выбор промпта для эталона/прогона — тот же принцип, что в модалке улучшения фото:
 * общий справочник промптов, избранные филиала сверху со звёздами, выбор версии
 * из history с тултипом тела и описанием (R-12/R-13.5).
 */
const PromptPicker: FC<Props> = ({ disabled, onPromptBodyChange }) => {
  const [selectedPromptId, setSelectedPromptId] = useState<string | undefined>();
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  // На странице Explorer нет projectId в URL — как в Recognition, берём первый филиал юзера.
  const branchId = profile?.workplace?.[0];

  const { data: promptsData, isLoading: isPromptsLoading } = useGetPrompts({
    axios: defaultApiAxiosParams,
  });
  const promptsList = promptsData?.data ?? [];

  const { data: favoritesData } = useGetFavoritePrompts(branchId, {
    enabled: !!branchId,
  });
  const { mutate: addFavorite } = usePostFavoritePrompt();
  const { mutate: removeFavorite } = useDeleteFavoritePrompt();

  const favoriteIdSet = new Set(favoritesData?.data.promptIds ?? []);
  const sortedPrompts = sortPromptsByFavorites(promptsList, favoriteIdSet);

  const selectedPrompt = promptsList.find((p) => p.id === selectedPromptId);
  const promptHistory = selectedPrompt?.history ?? [];
  const selectedHistoryItem =
    selectedVersion != null
      ? promptHistory.find((h) => h.promptVersion === selectedVersion)
      : undefined;
  const promptBody = resolvePromptBody(selectedPrompt, selectedVersion);

  const emitChange = (prompt: typeof selectedPrompt, version: string | null) => {
    onPromptBodyChange(resolvePromptBody(prompt, version));
  };

  const toggleFavorite = (promptId: string, e: React.MouseEvent<HTMLSpanElement>) => {
    e.stopPropagation();
    e.preventDefault();
    if (!branchId || !promptId) return;
    const variables = { projectId: branchId, promptId };
    const onSuccess = () =>
      queryClient.invalidateQueries(getFavoritePromptsKey(branchId));
    const onError = () =>
      showNotification({ message: "Не удалось обновить избранное", type: "error" });
    if (favoriteIdSet.has(promptId)) {
      removeFavorite(variables, { onSuccess, onError });
    } else {
      addFavorite(variables, { onSuccess, onError });
    }
  };

  return (
    <div className={css.promptPicker}>
      <Select
        searchable
        label="Промпт"
        placeholder="Выберите промпт"
        value={selectedPromptId}
        onChange={(value) => {
          const prompt = promptsList.find((p) => p.id === value);
          const version = defaultVersionOf(prompt);
          setSelectedPromptId(value ?? undefined);
          setSelectedVersion(version);
          emitChange(prompt, version);
        }}
        options={sortedPrompts.map((p) => ({
          label: p.title ?? "",
          value: p.id ?? "",
        }))}
        optionRender={(option) => {
          const id = String(option.value ?? "");
          const isFav = favoriteIdSet.has(id);
          return (
            <div className={css.promptOption}>
              <span className={css.promptOptionLabel}>{String(option.label ?? "")}</span>
              {branchId && (
                <span
                  className={cn(css.promptStar, isFav && css.promptStarActive)}
                  onMouseDown={(e) => {
                    // preventDefault сохраняет фокус инпута (иначе дропдаун закроется),
                    // stopPropagation не даёт выбрать пункт.
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={(e) => toggleFavorite(id, e)}
                >
                  {isFav ? <StarFilled /> : <StarOutlined />}
                </span>
              )}
            </div>
          );
        }}
        disabled={disabled}
        loading={isPromptsLoading}
      />

      {selectedPromptId && promptHistory.length > 0 && (
        <Select
          label="Версия"
          placeholder="Выберите версию"
          value={selectedVersion}
          onChange={(value) => {
            setSelectedVersion(value ?? null);
            emitChange(selectedPrompt, value ?? null);
          }}
          options={promptHistory.map((item: PromptResponseHistoryItem) => ({
            label: item.promptVersion,
            value: item.promptVersion,
          }))}
          optionRender={({ data }) => {
            const item = promptHistory.find((h) => h.promptVersion === data.value);
            return (
              <Tooltip title={item?.promptBody ?? ""} placement="left">
                <span>{item?.promptVersion ?? data.value}</span>
              </Tooltip>
            );
          }}
          disabled={disabled}
        />
      )}

      {selectedHistoryItem?.description && (
        <div className={css.promptDescription}>
          <div className={css.promptDescriptionTitle}>Описание</div>
          <div>{selectedHistoryItem.description}</div>
        </div>
      )}

      {promptBody && (
        <div className={css.promptBodyPreview}>
          <div className={css.promptDescriptionTitle}>Текст промпта (уйдёт в прогон)</div>
          <div className={css.promptBodyText}>{promptBody}</div>
        </div>
      )}
    </div>
  );
};

export default PromptPicker;
