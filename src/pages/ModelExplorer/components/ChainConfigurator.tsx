import React, { FC, useMemo, useState } from "react";
import { Input, Popconfirm, Switch, Table, Tag, Tooltip } from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  MinusCircleOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useQueryClient } from "react-query";
import Button from "../../../components/Button/Button";
import Modal from "../../../components/Modal/Modal";
import Select from "../../../components/Select/Select";
import { showNotification } from "../../../components/ShowNotification";
import {
  ExplorerChainConfig,
  ExplorerModelInfo,
  ExplorerResolution,
  explorerConfigKey,
  useCreateChain,
  useDeleteChain,
  useUpdateChain,
} from "../../../api/explorerApi";
import css from "../index.module.css";

const usd = (value?: number) =>
  value === undefined ? "—" : `$${value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "")}`;

const MAX_STEPS = 5;

type EditorState = {
  id?: string; // undefined = создание
  title: string;
  steps: string[]; // [0] — генеративная, дальше апскейлеры
};

type Props = {
  chains: ExplorerChainConfig[];
  models: ExplorerModelInfo[];
  resolution: ExplorerResolution;
  /** админ: правка; руководитель: только чтение (R-19.7) */
  canEdit: boolean;
};

/**
 * Конфигуратор цепочек (R-19): состав набора, шаги из кураторского справочника
 * моделей, включение/выключение цепочек — прогон исполняет включённые.
 */
const ChainConfigurator: FC<Props> = ({ chains, models, resolution, canEdit }) => {
  const queryClient = useQueryClient();
  const [editor, setEditor] = useState<EditorState | null>(null);

  const generativeOptions = useMemo(
    () =>
      models
        .filter((m) => m.kind === "generative")
        .map((m) => ({ label: `${m.title} · ${usd(m.priceUsd[resolution])}`, value: m.slug })),
    [models, resolution]
  );
  const upscaleOptions = useMemo(
    () =>
      models
        .filter((m) => m.kind === "upscale")
        .map((m) => ({ label: `${m.title} · ${usd(m.priceUsd[resolution])}`, value: m.slug })),
    [models, resolution]
  );

  const invalidate = () => queryClient.invalidateQueries(explorerConfigKey);
  const onError = (err: unknown) =>
    showNotification({
      type: "error",
      message:
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Не удалось сохранить цепочку",
    });

  const createChain = useCreateChain({ onSuccess: () => { void invalidate(); setEditor(null); }, onError });
  const updateChain = useUpdateChain({ onSuccess: () => { void invalidate(); setEditor(null); }, onError });
  const deleteChain = useDeleteChain({ onSuccess: () => void invalidate(), onError });

  const editorEstimate = (steps: string[]) =>
    steps.reduce(
      (sum, slug) => sum + (models.find((m) => m.slug === slug)?.priceUsd[resolution] ?? 0),
      0
    );

  const editorValid =
    editor !== null &&
    editor.title.trim().length > 0 &&
    editor.steps.length >= 1 &&
    editor.steps.every((s) => s.length > 0);

  const saveEditor = () => {
    if (!editor || !editorValid) return;
    const body = { title: editor.title.trim(), steps: editor.steps };
    if (editor.id) {
      updateChain.mutate({ id: editor.id, patch: body });
    } else {
      createChain.mutate(body);
    }
  };

  const columns = [
    {
      title: "Цепочка",
      dataIndex: "title",
      key: "title",
      render: (_: unknown, chain: ExplorerChainConfig) => (
        <div>
          <div className={css.chainTitle}>{chain.title}</div>
          <div className={css.chainModels}>
            {chain.stepsInfo.map((info, i) =>
              info ? (
                <Tag key={`${chain.id}-${i}`} color={info.kind === "generative" ? "purple" : "blue"}>
                  {info.title}
                </Tag>
              ) : (
                <Tooltip key={`${chain.id}-${i}`} title="Модель убрана из справочника">
                  <Tag color="error">{chain.steps[i]}</Tag>
                </Tooltip>
              )
            )}
          </div>
        </div>
      ),
    },
    {
      title: `Цена (${resolution})`,
      key: "price",
      width: 110,
      render: (_: unknown, chain: ExplorerChainConfig) => usd(chain.estimateUsd[resolution]),
    },
    {
      title: "В прогоне",
      key: "enabled",
      width: 110,
      render: (_: unknown, chain: ExplorerChainConfig) => (
        <Switch
          checked={chain.enabled}
          disabled={!canEdit || updateChain.isLoading}
          onChange={(enabled) => updateChain.mutate({ id: chain.id, patch: { enabled } })}
        />
      ),
    },
    ...(canEdit
      ? [
          {
            title: "",
            key: "actions",
            width: 110,
            render: (_: unknown, chain: ExplorerChainConfig) => (
              <div className={css.configuratorActions}>
                <Button
                  size="small"
                  onClick={() =>
                    setEditor({ id: chain.id, title: chain.title, steps: [...chain.steps] })
                  }
                >
                  <EditOutlined />
                </Button>
                <Popconfirm
                  title="Удалить цепочку из набора?"
                  okText="Удалить"
                  cancelText="Отмена"
                  onConfirm={() => deleteChain.mutate(chain.id)}
                >
                  <Button size="small">
                    <DeleteOutlined />
                  </Button>
                </Popconfirm>
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className={css.section}>
      <div className={css.configuratorHeader}>
        <h2 className={css.sectionTitle}>Конфигуратор цепочек</h2>
        {canEdit && (
          <Button onClick={() => setEditor({ title: "", steps: [""] })}>
            <PlusOutlined /> Добавить цепочку
          </Button>
        )}
      </div>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={chains}
        pagination={false}
        size="small"
        scroll={{ x: true }}
      />

      <Modal
        title={editor?.id ? "Редактирование цепочки" : "Новая цепочка"}
        open={Boolean(editor)}
        onOk={saveEditor}
        onCancel={() => setEditor(null)}
        okButtonName={`Сохранить (${usd(editorEstimate(editor?.steps ?? []))} за прогон)`}
        cancelButtonName="Отмена"
        okButtonDisabled={!editorValid}
        isLoading={createChain.isLoading || updateChain.isLoading}
        destroyOnHidden
      >
        {editor && (
          <div className={css.editorBody}>
            <label className={css.label}>Название</label>
            <Input
              value={editor.title}
              onChange={(e) => setEditor({ ...editor, title: e.target.value })}
              placeholder="Например: Seedream 4 → Crystal"
              maxLength={80}
            />

            <label className={css.label}>
              Шаг 1 — генеративная модель (получает промпт прогона)
            </label>
            <Select
              placeholder="Выберите модель"
              value={editor.steps[0] || undefined}
              onChange={(value) =>
                setEditor({ ...editor, steps: [value ?? "", ...editor.steps.slice(1)] })
              }
              options={generativeOptions}
            />

            {editor.steps.slice(1).map((slug, i) => (
              <div key={`step-${i + 1}`}>
                <label className={css.label}>Шаг {i + 2} — апскейлер</label>
                <div className={css.editorStepRow}>
                  <Select
                    placeholder="Выберите апскейлер"
                    value={slug || undefined}
                    onChange={(value) => {
                      const steps = [...editor.steps];
                      steps[i + 1] = value ?? "";
                      setEditor({ ...editor, steps });
                    }}
                    options={upscaleOptions}
                  />
                  <Button
                    size="small"
                    onClick={() =>
                      setEditor({
                        ...editor,
                        steps: editor.steps.filter((_, idx) => idx !== i + 1),
                      })
                    }
                    aria-label="Убрать шаг"
                  >
                    <MinusCircleOutlined />
                  </Button>
                </div>
              </div>
            ))}

            {editor.steps.length < MAX_STEPS && (
              <Button
                onClick={() => setEditor({ ...editor, steps: [...editor.steps, ""] })}
                disabled={!editor.steps[0]}
              >
                <PlusOutlined /> Добавить шаг-апскейлер
              </Button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ChainConfigurator;
