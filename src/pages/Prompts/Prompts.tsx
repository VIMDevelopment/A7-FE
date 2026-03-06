import React, { useEffect, useState } from "react";
import css from "./index.module.css";
import { defaultApiAxiosParams } from "../../api/helpers";
import Input from "../../components/Input/Input";
import InputTextArea from "../../components/TextArea/Input";
import Button from "../../components/Button/Button";
import Select from "../../components/Select/Select";
import {
  useGetPrompts,
  usePostPrompts,
  usePutPromptsId,
} from "../../apiV2/a7-service";
import type { PromptResponseHistoryItem } from "../../apiV2/a7-service/model/promptResponseHistoryItem";
import { showNotification } from "../../components/ShowNotification";
import { useQueryClient } from "react-query";

const PromptsPage = () => {
  const queryClient = useQueryClient();
  const [createTitle, setCreateTitle] = useState("");
  const [createBody, setCreateBody] = useState("");
  const [selectedPromptId, setSelectedPromptId] = useState<string | undefined>();
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");

  const { data: promptsData, isLoading: isPromptsLoading } = useGetPrompts({
    axios: defaultApiAxiosParams,
  });

  const { mutateAsync: createPrompt, isLoading: isCreateLoading } =
    usePostPrompts({
      axios: defaultApiAxiosParams,
    });

  const { mutateAsync: updatePrompt, isLoading: isUpdateLoading } =
    usePutPromptsId({
      axios: defaultApiAxiosParams,
    });

  const promptsList = promptsData?.data ?? [];
  const selectedPrompt = promptsList.find((p) => p.id === selectedPromptId);
  const promptHistory = selectedPrompt?.history ?? []

  useEffect(() => {
    setSelectedVersion(null);
    if (selectedPrompt?.body != null) {
      setEditBody(selectedPrompt.body);
    } else {
      setEditBody("");
    }
  }, [selectedPrompt?.id, selectedPrompt?.body]);

  const handleCreate = async () => {
    if (!createTitle.trim() || !createBody.trim()) return;
    try {
      await createPrompt({
        data: { title: createTitle.trim(), body: createBody.trim() },
      });
      showNotification({
        type: "success",
        message: "Промпт создан",
      });
      setCreateTitle("");
      setCreateBody("");
      void queryClient.invalidateQueries({ queryKey: ["/prompts"] });
    } catch {
      // ошибка показывается через глобальный onError в QueryClient
    }
  };

  const handleUpdate = async () => {
    if (!selectedPromptId || selectedPrompt == null) return;
    try {
      await updatePrompt({
        id: selectedPromptId,
        data: {
          title: selectedPrompt.title,
          body: editBody,
        },
      });
      showNotification({
        type: "success",
        message: "Промпт обновлён",
      });
      void queryClient.invalidateQueries({ queryKey: ["/prompts"] });
    } catch {
      // ошибка показывается через глобальный onError в QueryClient
    }
  };

  return (
    <div className={css.container}>
      <div className={css.pageTitle}>Промпты</div>

      <div className={css.section}>
        <div className={css.sectionTitle}>Создать промпт</div>
        <div className={css.form}>
          <Input
            label="Название промпта"
            value={createTitle}
            onChange={(e) => setCreateTitle(e.target.value)}
            disabled={isCreateLoading}
            placeholder="Введите название"
          />
          <InputTextArea
            label="Текст промпта"
            value={createBody}
            onChange={(e) => setCreateBody(e.target.value)}
            disabled={isCreateLoading}
            placeholder="Введите текст промпта"
            className={css.bodyField}
            rows={4}
            count={1}
          />
          <Button
            className={css.btn}
            disabled={isCreateLoading || !createTitle.trim() || !createBody.trim()}
            onClick={handleCreate}
            showSpinner={isCreateLoading}
          >
            Создать промпт
          </Button>
        </div>
      </div>

      <div className={css.section}>
        <div className={css.sectionTitle}>Изменить существующий промпт</div>
        <div className={css.form}>
          <div className={css.editPromptRow}>
            <div className={css.selectPrompt}>
              <Select
                label="Промпт"
                placeholder="Выберите промпт"
                value={selectedPromptId ?? undefined}
                onChange={(value) => setSelectedPromptId(value ?? undefined)}
                options={promptsList.map((p) => ({
                  label: p.title ?? "",
                  value: p.id ?? "",
                }))}
                disabled={isPromptsLoading}
                loading={isPromptsLoading}
              />
            </div>
            {selectedPromptId && promptHistory.length > 0 && (
                <div className={css.selectVersion}>
                  <Select
                    label="Версия"
                    placeholder="Версия"
                    value={selectedVersion}
                    onChange={(value) => {
                      setSelectedVersion(value);
                      const currentVersionBody = promptHistory.find(item => item.promptVersion === value)?.promptBody ?? "";
                      setEditBody(currentVersionBody)
                    }}
                    options={promptHistory.map((item: PromptResponseHistoryItem) => ({
                      label: item.promptVersion,
                      value: item.promptVersion,
                    }))}
                  />
                </div>
              )}
          </div>
          <InputTextArea
            label="Текст промпта"
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
            disabled={isUpdateLoading || !selectedPromptId}
            placeholder="Выберите промпт или введите текст"
            className={css.bodyField}
            rows={4}
            count={1}
          />
          <Button
            className={css.btn}
            disabled={
              isUpdateLoading || !selectedPromptId || editBody === selectedPrompt?.body
            }
            onClick={handleUpdate}
            showSpinner={isUpdateLoading}
          >
            Сохранить
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PromptsPage;
