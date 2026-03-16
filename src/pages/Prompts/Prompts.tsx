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
  useDeletePromptsId,
} from "../../apiV2/a7-service";
import type { PromptResponseHistoryItem } from "../../apiV2/a7-service/model/promptResponseHistoryItem";
import { showNotification } from "../../components/ShowNotification";
import { useQueryClient } from "react-query";
import Modal from "../../components/Modal/Modal";

const PromptsPage = () => {
  const queryClient = useQueryClient();
  const [createTitle, setCreateTitle] = useState("");
  const [createBody, setCreateBody] = useState("");
  const [createVersion, setCreateVersion] = useState("");
  const [selectedPromptId, setSelectedPromptId] = useState<string | undefined>();
  const [versionForSave, setVersionForSave] = useState("");
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [promptToDelete, setPromptToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [deleteSelectedPromptId, setDeleteSelectedPromptId] = useState<
    string | undefined
  >(undefined);

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

  const { mutateAsync: deletePrompt, isLoading: isDeleteLoading } =
    useDeletePromptsId({
      axios: defaultApiAxiosParams,
    });

  const promptsList = promptsData?.data ?? [];
  const selectedPrompt = promptsList.find((p) => p.id === selectedPromptId);
  const promptHistory = selectedPrompt?.history ?? []

  useEffect(() => {
    if (selectedPrompt == null) {
      setSelectedVersion(null);
      setEditBody("");
      setVersionForSave("");
      return;
    }
    const history = selectedPrompt.history ?? [];
    if (history.length > 0) {
      const lastVersion = history[history.length - 1];
      setSelectedVersion(lastVersion.promptVersion);
      setEditBody(lastVersion.promptBody);
    } else {
      setSelectedVersion(null);
      setEditBody(selectedPrompt.body ?? "");
    }
    setVersionForSave("");
  }, [selectedPrompt?.id, selectedPrompt?.body, selectedPrompt?.history]);

  const handleCreate = async () => {
    const version = createVersion.trim();
    if (!createTitle.trim() || !createBody.trim() || !version) return;
    const title = createTitle.trim();
    const body = createBody.trim();
    try {
      const response = await createPrompt({
        data: { title, body },
      });
      const createdId = response.data.id;
      if (createdId) {
        await updatePrompt({
          id: createdId,
          data: {
            title,
            body,
            history: [
              {
                promptVersion: version,
                promptBody: body,
                description: "",
                rate: 0,
              },
            ],
          },
        });
      }
      showNotification({
        type: "success",
        message: "Промпт создан",
      });
      setCreateTitle("");
      setCreateBody("");
      setCreateVersion("");
      void queryClient.invalidateQueries({ queryKey: ["/prompts"] });
    } catch {
      // ошибка показывается через глобальный onError в QueryClient
    }
  };

  const handleUpdate = async () => {
    const version = versionForSave.trim();
    if (!selectedPromptId || selectedPrompt == null || !version) return;
    const prevHistory = selectedPrompt.history ?? [];
    const newHistory = [
      ...prevHistory,
      {
        promptVersion: version,
        promptBody: editBody,
        description: "",
        rate: 0,
      },
    ];
    try {
      await updatePrompt({
        id: selectedPromptId,
        data: {
          title: selectedPrompt.title,
          body: editBody,
          history: newHistory,
        },
      });
      showNotification({
        type: "success",
        message: "Промпт обновлён",
      });
      setVersionForSave("");
      void queryClient.invalidateQueries({ queryKey: ["/prompts"] });
    } catch {
      // ошибка показывается через глобальный onError в QueryClient
    }
  };

  const handleDeleteOk = async () => {
    if (!promptToDelete) return;
    try {
      await deletePrompt({ id: promptToDelete.id });
      showNotification({
        type: "success",
        message: "Промпт удалён",
      });
      setPromptToDelete(null);
      setDeleteSelectedPromptId(undefined);
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
            placeholder="Введите название промпта"
          />
          <Input
            label="Название первой версии"
            value={createVersion}
            onChange={(e) => setCreateVersion(e.target.value)}
            disabled={isCreateLoading}
            placeholder="Введите название первой версии"
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
            disabled={
              isCreateLoading ||
              !createTitle.trim() ||
              !createBody.trim() ||
              !createVersion.trim()
            }
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
          <Input
            label="Название новой версии (опционально, при заполнении этого поля создается новая версия промпта)"
            value={versionForSave}
            onChange={(e) => setVersionForSave(e.target.value)}
            disabled={isUpdateLoading || !selectedPromptId}
            placeholder="Введите название новой версии"
          />
          <Button
            className={css.btn}
            disabled={
              isUpdateLoading || !selectedPromptId || !versionForSave.trim()
            }
            onClick={handleUpdate}
            showSpinner={isUpdateLoading}
          >
            Сохранить
          </Button>
        </div>
      </div>

      <div className={css.section}>
        <div className={css.sectionTitle}>Удаление промптов</div>
        <div className={css.form}>
          <div className={css.deletePromptContainer}>
            <div className={css.selectPrompt}>
              <Select
                label="Промпт"
                placeholder="Выберите промпт"
                value={deleteSelectedPromptId}
                onChange={(value) => setDeleteSelectedPromptId(value ?? undefined)}
                options={promptsList.map((p) => ({
                  label: p.title ?? "",
                  value: p.id ?? "",
                }))}
                disabled={isPromptsLoading}
                loading={isPromptsLoading}
              />
            </div>
            <Button
              className={`${css.btn} ${css.deleteButton}`}
              disabled={isPromptsLoading || !deleteSelectedPromptId}
              onClick={() => {
                const p = promptsList.find((x) => x.id === deleteSelectedPromptId);
                if (p)
                  setPromptToDelete({
                    id: p.id ?? "",
                    title: p.title ?? "",
                  });
              }}
            >
              Удалить
            </Button>
          </div>
        </div>
      </div>

      <Modal
        title="Удаление промпта"
        open={promptToDelete !== null}
        onOk={handleDeleteOk}
        onCancel={() => setPromptToDelete(null)}
        okButtonName="Удалить"
        destroyOnHidden
        isLoading={isDeleteLoading}
        customOkButtonClassName={css.deleteButton}
      >
        {promptToDelete &&
          `Вы уверены, что хотите удалить промпт «${promptToDelete.title}»? Это действие необратимо.`}
      </Modal>
    </div>
  );
};

export default PromptsPage;
