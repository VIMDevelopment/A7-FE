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
import { DeleteOutlined } from "@ant-design/icons";
import { Tabs } from "antd";
import { validateNewPromptName } from "../../components/prompts/promptCatalog";

/**
 * Справочник (R-38): запись = КАТЕГОРИЯ («Комикс»), её history = ПРОМПТЫ внутри
 * («Страница», «Значок»). Хранение и API прежние (promptVersion = название промпта):
 * десктоп на точках синхронизирует справочник с прода и работает без нового релиза.
 */
const PromptsPage = () => {
  const queryClient = useQueryClient();

  // «Новая категория»
  const [createTitle, setCreateTitle] = useState("");
  const [createPromptName, setCreatePromptName] = useState("");
  const [createBody, setCreateBody] = useState("");
  const [createDescription, setCreateDescription] = useState("");

  // «Добавить промпт» в существующую категорию (R-38.3)
  const [addCategoryId, setAddCategoryId] = useState<string | undefined>();
  const [addPromptName, setAddPromptName] = useState("");
  const [addBody, setAddBody] = useState("");
  const [addDescription, setAddDescription] = useState("");

  // «Изменение»
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>();
  const [selectedPromptName, setSelectedPromptName] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [editDescription, setEditDescription] = useState("");

  // «Удаление»
  const [categoryToDelete, setCategoryToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | undefined>(undefined);
  const [promptToDelete, setPromptToDelete] = useState<{
    categoryId: string;
    categoryTitle: string;
    promptName: string;
  } | null>(null);

  const { data: promptsData, isLoading: isCategoriesLoading } = useGetPrompts({
    axios: defaultApiAxiosParams,
  });

  const { mutateAsync: createCategory, isLoading: isCreateLoading } =
    usePostPrompts({
      axios: defaultApiAxiosParams,
    });

  const { mutateAsync: updateCategory, isLoading: isUpdateLoading } =
    usePutPromptsId({
      axios: defaultApiAxiosParams,
    });

  const { mutateAsync: deleteCategory, isLoading: isDeleteLoading } =
    useDeletePromptsId({
      axios: defaultApiAxiosParams,
    });

  const categories = promptsData?.data ?? [];
  const categoryOptions = categories.map((c) => ({
    label: c.title ?? "",
    value: c.id ?? "",
  }));
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const selectedPrompts = selectedCategory?.history ?? [];
  const addCategory = categories.find((c) => c.id === addCategoryId);
  const addNameError = addCategoryId
    ? validateNewPromptName(addCategory, addPromptName)
    : null;

  useEffect(() => {
    if (selectedCategory == null) {
      setSelectedPromptName(null);
      setEditBody("");
      setEditDescription("");
      return;
    }
    const prompts = selectedCategory.history ?? [];
    const stillThere =
      selectedPromptName != null &&
      prompts.some((item) => item.promptVersion === selectedPromptName);
    if (!stillThere) {
      setSelectedPromptName(null);
      setEditBody("");
      setEditDescription("");
    }
  }, [selectedCategory?.id, selectedCategory?.body, selectedCategory?.history]);

  const invalidate = () =>
    void queryClient.invalidateQueries({ queryKey: ["/prompts"] });

  const handleCreateCategory = async () => {
    const title = createTitle.trim();
    const promptName = createPromptName.trim();
    const body = createBody.trim();
    const description = createDescription.trim();
    if (!title || !promptName || !body) return;
    try {
      const response = await createCategory({ data: { title, body } });
      const createdId = response.data.id;
      if (createdId) {
        await updateCategory({
          id: createdId,
          data: {
            title,
            body,
            history: [
              { promptVersion: promptName, promptBody: body, ru: body, description, rate: 0 },
            ],
          },
        });
      }
      showNotification({ type: "success", message: "Категория создана" });
      setCreateTitle("");
      setCreatePromptName("");
      setCreateBody("");
      setCreateDescription("");
      invalidate();
    } catch {
      // ошибка показывается через глобальный onError в QueryClient
    }
  };

  const handleAddPrompt = async () => {
    if (!addCategoryId || !addCategory || addNameError || !addBody.trim()) return;
    const promptName = addPromptName.trim();
    const body = addBody.trim();
    try {
      await updateCategory({
        id: addCategoryId,
        data: {
          title: addCategory.title,
          history: [
            ...(addCategory.history ?? []),
            {
              promptVersion: promptName,
              promptBody: body,
              ru: body,
              description: addDescription.trim(),
              rate: 0,
            },
          ],
        },
      });
      showNotification({
        type: "success",
        message: `Промпт «${promptName}» добавлен в категорию «${addCategory.title}»`,
      });
      setAddPromptName("");
      setAddBody("");
      setAddDescription("");
      invalidate();
    } catch {
      // ошибка показывается через глобальный onError в QueryClient
    }
  };

  const handleUpdatePrompt = async () => {
    if (!selectedCategoryId || selectedCategory == null || selectedPromptName == null) return;
    const newHistory = (selectedCategory.history ?? []).map((item) =>
      item.promptVersion === selectedPromptName
        ? { ...item, promptBody: editBody, ru: editBody, description: editDescription.trim() }
        : item
    );
    try {
      await updateCategory({
        id: selectedCategoryId,
        data: { title: selectedCategory.title, history: newHistory },
      });
      showNotification({ type: "success", message: "Промпт обновлён" });
      invalidate();
    } catch {
      // ошибка показывается через глобальный onError в QueryClient
    }
  };

  const handleDeleteCategoryOk = async () => {
    if (!categoryToDelete) return;
    try {
      await deleteCategory({ id: categoryToDelete.id });
      showNotification({ type: "success", message: "Категория удалена" });
      setCategoryToDelete(null);
      setDeleteCategoryId(undefined);
      invalidate();
    } catch {
      // ошибка показывается через глобальный onError в QueryClient
    }
  };

  const handleDeletePromptOk = async () => {
    if (!promptToDelete) return;
    const category = categories.find((c) => c.id === promptToDelete.categoryId);
    if (!category) return;
    const prevHistory = category.history ?? [];
    // последний промпт категории не удаляется — удаляется категория целиком (R-38.4)
    if (prevHistory.length <= 1) return;
    const newHistory = prevHistory.filter(
      (item) => item.promptVersion !== promptToDelete.promptName
    );
    try {
      await updateCategory({
        id: promptToDelete.categoryId,
        data: { title: category.title, history: newHistory },
      });
      showNotification({ type: "success", message: "Промпт удалён" });
      setPromptToDelete(null);
      if (
        selectedCategoryId === promptToDelete.categoryId &&
        selectedPromptName === promptToDelete.promptName
      ) {
        setSelectedPromptName(null);
        setEditBody("");
        setEditDescription("");
      }
      invalidate();
    } catch {
      // ошибка показывается через глобальный onError в QueryClient
    }
  };

  const promptOptions = selectedPrompts.map((item: PromptResponseHistoryItem) => ({
    label: item.promptVersion,
    value: item.promptVersion,
  }));

  return (
    <div className={css.container}>
      <div className={css.pageTitle}>Промпты</div>

      <Tabs
        className={css.tabs}
        defaultActiveKey="create"
        items={[
          {
            key: "create",
            label: "Новая категория",
            children: (
              <div className={css.section}>
                <div className={css.sectionTitle}>Новая категория с первым промптом</div>
                <div className={css.form}>
                  <Input
                    label="Название категории"
                    value={createTitle}
                    onChange={(e) => setCreateTitle(e.target.value)}
                    disabled={isCreateLoading}
                    placeholder="Например: Комикс"
                  />
                  <Input
                    label="Название первого промпта"
                    value={createPromptName}
                    onChange={(e) => setCreatePromptName(e.target.value)}
                    disabled={isCreateLoading}
                    placeholder="Например: Страница комикса"
                  />
                  {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                  {/* @ts-ignore */}
                  <InputTextArea
                    label="Текст промпта"
                    value={createBody}
                    onChange={(e) => setCreateBody(e.target.value)}
                    disabled={isCreateLoading}
                    placeholder="Введите текст промпта"
                    className={css.bodyField}
                    rows={4}
                  />
                  {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                  {/* @ts-ignore */}
                  <InputTextArea
                    label="Описание промпта (опционально)"
                    value={createDescription}
                    onChange={(e) => setCreateDescription(e.target.value)}
                    disabled={isCreateLoading}
                    placeholder="Что получится на фото"
                    className={css.bodyField}
                    rows={2}
                  />
                  <Button
                    className={css.btn}
                    disabled={
                      isCreateLoading ||
                      !createTitle.trim() ||
                      !createPromptName.trim() ||
                      !createBody.trim()
                    }
                    onClick={handleCreateCategory}
                    showSpinner={isCreateLoading}
                  >
                    Создать категорию
                  </Button>
                </div>
              </div>
            ),
          },
          {
            key: "add",
            label: "Добавить промпт",
            children: (
              <div className={css.section}>
                <div className={css.sectionTitle}>Добавить промпт в категорию</div>
                <div className={css.form}>
                  <Select
                    searchable
                    label="Категория"
                    placeholder="Выберите категорию"
                    value={addCategoryId}
                    onChange={(value) => setAddCategoryId(value ?? undefined)}
                    options={categoryOptions}
                    disabled={isCategoriesLoading}
                    loading={isCategoriesLoading}
                  />
                  <Input
                    label="Название промпта"
                    value={addPromptName}
                    onChange={(e) => setAddPromptName(e.target.value)}
                    disabled={isUpdateLoading || !addCategoryId}
                    placeholder="Например: Круглый значок"
                  />
                  {addPromptName.trim() && addNameError && (
                    <div className={css.fieldError}>{addNameError}</div>
                  )}
                  {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                  {/* @ts-ignore */}
                  <InputTextArea
                    label="Текст промпта"
                    value={addBody}
                    onChange={(e) => setAddBody(e.target.value)}
                    disabled={isUpdateLoading || !addCategoryId}
                    placeholder="Введите текст промпта"
                    className={css.bodyField}
                    rows={4}
                  />
                  {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                  {/* @ts-ignore */}
                  <InputTextArea
                    label="Описание промпта (опционально)"
                    value={addDescription}
                    onChange={(e) => setAddDescription(e.target.value)}
                    disabled={isUpdateLoading || !addCategoryId}
                    placeholder="Что получится на фото"
                    className={css.bodyField}
                    rows={2}
                  />
                  <Button
                    className={css.btn}
                    disabled={
                      isUpdateLoading || !addCategoryId || !!addNameError || !addBody.trim()
                    }
                    onClick={handleAddPrompt}
                    showSpinner={isUpdateLoading}
                  >
                    Добавить промпт
                  </Button>
                </div>
              </div>
            ),
          },
          {
            key: "update",
            label: "Изменение",
            children: (
              <div className={css.section}>
                <div className={css.sectionTitle}>Изменение промпта</div>
                <div className={css.form}>
                  <div className={css.editPromptRow}>
                    <div className={css.selectPrompt}>
                      <Select
                        searchable
                        label="Категория"
                        placeholder="Выберите категорию"
                        value={selectedCategoryId ?? undefined}
                        onChange={(value) => setSelectedCategoryId(value ?? undefined)}
                        options={categoryOptions}
                        disabled={isCategoriesLoading}
                        loading={isCategoriesLoading}
                      />
                    </div>
                    {selectedCategoryId && selectedPrompts.length > 0 && (
                      <div className={css.selectVersion}>
                        <Select
                          label="Промпт"
                          placeholder="Выберите промпт"
                          value={selectedPromptName}
                          onChange={(value) => {
                            setSelectedPromptName(value);
                            const current = selectedPrompts.find(
                              (item) => item.promptVersion === value
                            );
                            setEditBody(current?.ru ?? current?.promptBody ?? "");
                            setEditDescription(current?.description ?? "");
                          }}
                          options={promptOptions}
                          optionRender={(option) => (
                            <div className={css.versionOption}>
                              <span className={css.optionText}>
                                {option.label ?? option.value}
                              </span>
                              {selectedPrompts.length > 1 && (
                                <DeleteOutlined
                                  className={css.versionOptionDelete}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    if (selectedCategoryId && selectedCategory) {
                                      setPromptToDelete({
                                        categoryId: selectedCategoryId,
                                        categoryTitle: selectedCategory.title ?? "",
                                        promptName: String(option.value),
                                      });
                                    }
                                  }}
                                />
                              )}
                            </div>
                          )}
                        />
                      </div>
                    )}
                  </div>
                  {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                  {/* @ts-ignore */}
                  <InputTextArea
                    label="Текст промпта"
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    disabled={isUpdateLoading || selectedPromptName == null}
                    placeholder="Выберите категорию и промпт"
                    className={css.bodyField}
                    rows={4}
                  />
                  {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                  {/* @ts-ignore */}
                  <InputTextArea
                    label="Описание промпта (опционально)"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    disabled={isUpdateLoading || selectedPromptName == null}
                    placeholder="Что получится на фото"
                    className={css.bodyField}
                    rows={2}
                  />
                  <Button
                    className={css.btn}
                    disabled={
                      isUpdateLoading || selectedPromptName == null || !editBody.trim()
                    }
                    onClick={handleUpdatePrompt}
                    showSpinner={isUpdateLoading}
                  >
                    Сохранить
                  </Button>
                </div>
              </div>
            ),
          },
          {
            key: "delete",
            label: "Удаление",
            children: (
              <div className={css.section}>
                <div className={css.sectionTitle}>Удаление категории</div>
                <div className={css.form}>
                  <div className={css.deletePromptContainer}>
                    <div className={css.selectPrompt}>
                      <Select
                        searchable
                        label="Категория"
                        placeholder="Выберите категорию"
                        value={deleteCategoryId}
                        onChange={(value) => setDeleteCategoryId(value ?? undefined)}
                        options={categoryOptions}
                        disabled={isCategoriesLoading}
                        loading={isCategoriesLoading}
                      />
                    </div>
                    <div className={css.hint}>
                      Отдельный промпт удаляется на вкладке «Изменение» — корзина рядом с ним в списке.
                    </div>
                    <Button
                      className={`${css.btn} ${css.deleteButton}`}
                      disabled={isCategoriesLoading || !deleteCategoryId}
                      onClick={() => {
                        const c = categories.find((x) => x.id === deleteCategoryId);
                        if (c) setCategoryToDelete({ id: c.id ?? "", title: c.title ?? "" });
                      }}
                    >
                      Удалить категорию
                    </Button>
                  </div>
                </div>
              </div>
            ),
          },
        ]}
      />

      <Modal
        title="Удаление категории"
        open={categoryToDelete !== null}
        onOk={handleDeleteCategoryOk}
        onCancel={() => setCategoryToDelete(null)}
        okButtonName="Удалить"
        destroyOnHidden
        isLoading={isDeleteLoading}
        customOkButtonClassName={css.deleteButton}
      >
        {categoryToDelete &&
          `Удалить категорию «${categoryToDelete.title}» и все её промпты? Это действие необратимо.`}
      </Modal>

      <Modal
        title="Удаление промпта"
        open={promptToDelete !== null}
        onOk={handleDeletePromptOk}
        onCancel={() => setPromptToDelete(null)}
        okButtonName="Удалить"
        destroyOnHidden
        isLoading={isUpdateLoading}
        customOkButtonClassName={css.deleteButton}
      >
        {promptToDelete &&
          `Удалить промпт «${promptToDelete.promptName}» из категории «${promptToDelete.categoryTitle}»? Это действие необратимо.`}
      </Modal>
    </div>
  );
};

export default PromptsPage;
