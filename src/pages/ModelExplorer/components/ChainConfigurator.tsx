import React, { FC, useMemo, useState } from "react";
import { Input, Popconfirm, Radio, Switch, Table, Tag, Tooltip } from "antd";
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
  ChainStep,
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

type EditorStep = ChainStep & { stepKind: "generative" | "upscale" };

type EditorState = {
  id?: string; // undefined = создание
  title: string;
  steps: EditorStep[];
};

type Props = {
  chains: ExplorerChainConfig[];
  models: ExplorerModelInfo[];
  /** админ: правка; руководитель: только чтение (R-19.7) */
  canEdit: boolean;
};

/**
 * Конфигуратор цепочек (R-19): шаги из кураторского справочника — на каждом шаге
 * (кроме первого) выбирается тип (генеративная/апскейлер); у моделей, различающих
 * 2К/4К, разрешение выбирается на шаге (дефолт 2К). «Целевое разрешение» прогона
 * касается только эталона и на цепочки не влияет.
 */
const ChainConfigurator: FC<Props> = ({ chains, models, canEdit }) => {
  const queryClient = useQueryClient();
  const [editor, setEditor] = useState<EditorState | null>(null);

  const modelBySlug = useMemo(
    () => new Map(models.map((m) => [m.slug, m])),
    [models]
  );

  const optionsFor = (kind: "generative" | "upscale") =>
    models
      .filter((m) => m.kind === kind)
      .map((m) => ({ label: `${m.title} · ${usd(m.priceUsd["2K"])}`, value: m.slug }));

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

  /** цена шага — по его собственному разрешению (дефолт 2К); прогон на цепочки не влияет */
  const stepPrice = (step: ChainStep) =>
    modelBySlug.get(step.model)?.priceUsd[step.resolution ?? "2K"] ?? 0;

  const editorEstimate = (steps: ChainStep[]) =>
    steps.reduce((sum, step) => sum + stepPrice(step), 0);

  const editorValid =
    editor !== null &&
    editor.title.trim().length > 0 &&
    editor.steps.length >= 1 &&
    editor.steps.every((s) => s.model.length > 0);

  const saveEditor = () => {
    if (!editor || !editorValid) return;
    const body = {
      title: editor.title.trim(),
      steps: editor.steps.map(({ model, resolution: stepRes }) => ({
        model,
        ...(stepRes ? { resolution: stepRes } : {}),
      })),
    };
    if (editor.id) {
      updateChain.mutate({ id: editor.id, patch: body });
    } else {
      createChain.mutate(body);
    }
  };

  const openEditor = (chain?: ExplorerChainConfig) => {
    if (!chain) {
      setEditor({ title: "", steps: [{ model: "", stepKind: "generative" }] });
      return;
    }
    setEditor({
      id: chain.id,
      title: chain.title,
      steps: chain.steps.map((step) => ({
        ...step,
        stepKind: modelBySlug.get(step.model)?.kind ?? "upscale",
      })),
    });
  };

  const patchStep = (index: number, patch: Partial<EditorStep>) => {
    if (!editor) return;
    const steps = [...editor.steps];
    steps[index] = { ...steps[index], ...patch };
    setEditor({ ...editor, steps });
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
                  {info.resolution ? ` · ${info.resolution}` : ""}
                </Tag>
              ) : (
                <Tooltip key={`${chain.id}-${i}`} title="Модель убрана из справочника">
                  <Tag color="error">{chain.steps[i]?.model}</Tag>
                </Tooltip>
              )
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Цена",
      key: "price",
      width: 110,
      render: (_: unknown, chain: ExplorerChainConfig) => usd(chain.estimateUsd),
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
                <Button size="small" onClick={() => openEditor(chain)}>
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
          <Button onClick={() => openEditor()}>
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

            {editor.steps.map((step, i) => {
              const model = step.model ? modelBySlug.get(step.model) : undefined;
              return (
                <div key={`step-${i}`} className={css.editorStepCard}>
                  {i > 0 && (
                    <button
                      type="button"
                      className={css.editorStepRemove}
                      onClick={() =>
                        setEditor({
                          ...editor,
                          steps: editor.steps.filter((_, idx) => idx !== i),
                        })
                      }
                      aria-label="Убрать шаг"
                    >
                      <MinusCircleOutlined />
                    </button>
                  )}
                  <span className={css.label}>
                    Шаг {i + 1}
                    {i === 0 ? " — генеративная модель (получает промпт)" : ""}
                  </span>

                  {i > 0 && (
                    <Radio.Group
                      value={step.stepKind}
                      onChange={(e) =>
                        patchStep(i, {
                          stepKind: e.target.value,
                          model: "",
                          resolution: undefined,
                        })
                      }
                      size="small"
                    >
                      <Radio.Button value="generative">Генеративная</Radio.Button>
                      <Radio.Button value="upscale">Апскейлер</Radio.Button>
                    </Radio.Group>
                  )}

                  <Select
                    placeholder={
                      step.stepKind === "generative" ? "Выберите модель" : "Выберите апскейлер"
                    }
                    value={step.model || undefined}
                    onChange={(value) => {
                      const picked = value ? modelBySlug.get(value) : undefined;
                      patchStep(i, {
                        model: value ?? "",
                        resolution: picked?.resolutionChoice ? "2K" : undefined,
                      });
                    }}
                    options={optionsFor(step.stepKind)}
                  />

                  {model?.resolutionChoice && (
                    <div className={css.editorQualityRow}>
                      <span className={css.editorQualityLabel}>Разрешение шага:</span>
                      <Radio.Group
                        value={step.resolution ?? "2K"}
                        onChange={(e) =>
                          patchStep(i, { resolution: e.target.value as ExplorerResolution })
                        }
                        size="small"
                      >
                        <Radio.Button value="2K">2К · {usd(model.priceUsd["2K"])}</Radio.Button>
                        <Radio.Button value="4K">4К · {usd(model.priceUsd["4K"])}</Radio.Button>
                      </Radio.Group>
                    </div>
                  )}
                  {model && !model.resolutionChoice && (
                    <div className={css.editorQualityHint}>
                      Разрешение выхода у модели фиксированное
                    </div>
                  )}
                </div>
              );
            })}

            {editor.steps.length < MAX_STEPS && (
              <Button
                onClick={() =>
                  setEditor({
                    ...editor,
                    steps: [...editor.steps, { model: "", stepKind: "upscale" }],
                  })
                }
                disabled={!editor.steps[0].model}
              >
                <PlusOutlined /> Добавить шаг
              </Button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ChainConfigurator;
