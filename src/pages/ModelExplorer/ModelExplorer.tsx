import React, { FC, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Image, Input, Radio, Select, Spin, Table, Tabs, Tag, Upload } from "antd";
import { InboxOutlined, LoadingOutlined } from "@ant-design/icons";
import { useQueryClient } from "react-query";
import { useProfile } from "../../auth/auth";
import { showNotification } from "../../components/ShowNotification";
import Button from "../../components/Button/Button";
import Modal from "../../components/Modal/Modal";
import {
  ExplorerReference,
  ExplorerResolution,
  explorerRunsKey,
  useCreateReference,
  useExplorerConfig,
  useExplorerRun,
  useExplorerRuns,
  useStartRun,
  useStartRunWithoutReference,
} from "../../api/explorerApi";
import { canRunExplorer } from "./access";
import { canStartWithoutReference, effectivePrompt, PromptSource } from "./runMode";
import RunView from "./components/RunView";
import PromptPicker from "./components/PromptPicker";
import ChainConfigurator from "./components/ChainConfigurator";
import css from "./index.module.css";

const usd = (value?: number) =>
  value === undefined ? "—" : `$${value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "")}`;

/**
 * Model Explorer (R-11…R-16, R-19): сравнение цепочек Replicate против эталона
 * nano-banana-pro по цене и качеству. Просмотр — админ и руководители,
 * запуск платной обработки и конфигуратор — только админ (R-11.3).
 * Страница разбита на табы: Прогон / Конфигуратор цепочек / История.
 */
const ModelExplorerPage: FC = () => {
  const { data: profile } = useProfile();
  const isRunner = canRunExplorer(profile?.roles);
  const queryClient = useQueryClient();

  const { data: config } = useExplorerConfig();

  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  // промпт: из справочника или свой текст — свой уходит в модели дословно (R-35.4)
  const [promptSource, setPromptSource] = useState<PromptSource>("catalog");
  const [catalogPrompt, setCatalogPrompt] = useState<string | undefined>();
  const [ownPrompt, setOwnPrompt] = useState("");
  const prompt = effectivePrompt(promptSource, catalogPrompt, ownPrompt);
  const [resolution, setResolution] = useState<ExplorerResolution>("2K");
  const [reference, setReference] = useState<ExplorerReference | null>(null);
  const [referenceCached, setReferenceCached] = useState(false);
  // окно подтверждения суммы: прогон против эталона или быстрый без эталона (R-35)
  const [confirmMode, setConfirmMode] = useState<"reference" | "direct" | null>(null);
  const [referenceError, setReferenceError] = useState<string | null>(null);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"run" | "configurator" | "history">("run");
  const previewUrlRef = useRef<string | null>(null);

  const { data: runsData } = useExplorerRuns();
  // Ключ списка ["/explorer/runs"] префиксно накрывает и ключ прогона ["/explorer/runs", id]:
  // инвалидация без exact перезапрашивала сам прогон → его onSuccess снова инвалидировал
  // список → бесконечная петля запросов. Обновляем список только на переходе
  // running → завершён и строго exact.
  const prevRunStatusRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    prevRunStatusRef.current = undefined;
  }, [activeRunId]);
  const { data: runData } = useExplorerRun(activeRunId ?? undefined, {
    refetchInterval: (data) => (data?.run.status === "running" ? 3000 : false),
    onSuccess: (data) => {
      if (prevRunStatusRef.current === "running" && data.run.status !== "running") {
        void queryClient.invalidateQueries(explorerRunsKey, { exact: true });
        showNotification({
          type: data.run.status === "done" ? "success" : "info",
          message:
            data.run.status === "done"
              ? `Прогон завершён, факт ${usd(data.run.factUsd)}`
              : "Прогон завершён частично — упавшие цепочки можно перезапустить по одной",
        });
      }
      prevRunStatusRef.current = data.run.status;
    },
  });

  const createReference = useCreateReference({
    onSuccess: ({ reference: ref, cached }) => {
      setReference(ref);
      setReferenceCached(cached);
      setReferenceError(null);
      showNotification({
        type: "success",
        message: cached
          ? "Эталон найден в кэше — повторная оплата не нужна"
          : `Эталон получен, стоимость ${usd(ref.costUsd)}`,
      });
    },
    onError: (err) => {
      setReferenceError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Не удалось получить эталон — попробуйте ещё раз"
      );
    },
  });

  const onRunStarted = ({ run }: { run: { id: string } }) => {
    setConfirmMode(null);
    setActiveRunId(run.id);
    setActiveTab("run");
    void queryClient.invalidateQueries(explorerRunsKey, { exact: true });
  };
  const onRunStartError = (err: unknown) =>
    showNotification({
      type: "error",
      message:
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Не удалось запустить прогон",
    });

  const startRun = useStartRun({ onSuccess: onRunStarted, onError: onRunStartError });
  const startRunDirect = useStartRunWithoutReference({
    onSuccess: onRunStarted,
    onError: onRunStartError,
  });
  const runStarting = startRun.isLoading || startRunDirect.isLoading;

  const estimate = config?.estimateUsd;
  const overLimit =
    estimate !== undefined && config !== undefined && estimate > config.limitUsd;

  const handleFile = (f: File) => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const url = URL.createObjectURL(f);
    previewUrlRef.current = url;
    setFile(f);
    setFilePreview(url);
    setReference(null);
    return false; // antd Upload: не загружать самому
  };

  const referenceMatchesForm = Boolean(
    reference &&
      reference.prompt === prompt &&
      reference.resolution === resolution
  );
  const directRunAllowed = canStartWithoutReference({
    hasFile: Boolean(file),
    prompt,
    overLimit,
    busy: runStarting || createReference.isLoading,
  });

  const historyColumns = useMemo(
    () => [
      {
        title: "Дата",
        dataIndex: "createdAt",
        key: "createdAt",
        width: 160,
        render: (value: string) => new Date(value).toLocaleString("ru-RU"),
      },
      {
        title: "Фото",
        dataIndex: "sourceUrl",
        key: "sourceUrl",
        width: 90,
        render: (url: string) => (
          <Image src={url} alt="Исходник" className={css.historyThumb} preview={false} />
        ),
      },
      { title: "Промпт", dataIndex: "prompt", key: "prompt", ellipsis: true },
      {
        title: "Статус",
        dataIndex: "status",
        key: "status",
        width: 170,
        render: (status: string, item: { withReference?: boolean }) => (
          <>
            <Tag>{status}</Tag>
            {item.withReference === false && <Tag color="purple">без эталона</Tag>}
          </>
        ),
      },
      {
        title: "Стоимость",
        key: "cost",
        width: 140,
        render: (_: unknown, item: { estimateUsd: number; factUsd?: number }) =>
          `${usd(item.factUsd)} (оценка ${usd(item.estimateUsd)})`,
      },
    ],
    []
  );

  const runTabContent = (
    <>
      {isRunner && (
        <div className={css.newRunCard}>
          <h2 className={css.sectionTitle}>Новый прогон</h2>
          <div className={css.newRunGrid}>
            <div className={css.uploadCol}>
              {filePreview ? (
                <div className={css.previewWrap}>
                  <img src={filePreview} alt="Исходник" className={css.previewImg} />
                  {createReference.isLoading && (
                    <div className={css.previewOverlay}>
                      <Spin indicator={<LoadingOutlined spin style={{ fontSize: 42 }} />} />
                      <span>Обрабатываем эталон (nano-banana-pro)…</span>
                    </div>
                  )}
                  <Button
                    disabled={createReference.isLoading}
                    onClick={() => { setFile(null); setFilePreview(null); setReference(null); setReferenceError(null); }}
                  >
                    Заменить фото
                  </Button>
                </div>
              ) : (
                <Upload.Dragger
                  accept="image/*"
                  showUploadList={false}
                  beforeUpload={handleFile}
                  className={css.dragger}
                >
                  <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                  <p>Перетащите исходное фото или нажмите для выбора</p>
                </Upload.Dragger>
              )}
            </div>
            <div className={css.formCol}>
              <label className={css.label}>
                Промпт (один на прогон): из общего справочника — как в модалке улучшения — или свой текст
              </label>
              <Radio.Group
                value={promptSource}
                onChange={(e) => setPromptSource(e.target.value as PromptSource)}
                disabled={createReference.isLoading || runStarting}
                optionType="button"
                options={[
                  { value: "catalog", label: "Из справочника" },
                  { value: "own", label: "Свой текст" },
                ]}
              />
              {/* справочник держим смонтированным: при возврате к нему выбор не теряется */}
              <div style={{ display: promptSource === "catalog" ? undefined : "none" }}>
                <PromptPicker
                  disabled={createReference.isLoading || runStarting}
                  onPromptBodyChange={setCatalogPrompt}
                />
              </div>
              {promptSource === "own" && (
                <Input.TextArea
                  value={ownPrompt}
                  onChange={(e) => setOwnPrompt(e.target.value)}
                  autoSize={{ minRows: 5, maxRows: 14 }}
                  placeholder="Вставьте текст промпта — уйдёт в модели дословно, без справочника и перевода"
                  disabled={createReference.isLoading || runStarting}
                />
              )}
              <label className={css.label}>Разрешение эталона (на цепочки не влияет — у их шагов своё)</label>
              <Select
                value={resolution}
                onChange={(value: ExplorerResolution) => setResolution(value)}
                options={[
                  { value: "2K", label: `2К — эталон ${usd(config?.reference.priceUsd["2K"])}` },
                  { value: "4K", label: `4К — эталон ${usd(config?.reference.priceUsd["4K"])}` },
                ]}
                className={css.resolutionSelect}
              />

              <div className={css.actionsRow}>
                <Button
                  disabled={!file || !prompt || createReference.isLoading}
                  onClick={() =>
                    file &&
                    createReference.mutate({ photo: file, prompt, resolution })
                  }
                >
                  {createReference.isLoading
                    ? "Обрабатываем эталон…"
                    : `1. Получить эталон (${usd(config?.reference.priceUsd[resolution])})`}
                </Button>
                <Button
                  disabled={!referenceMatchesForm || runStarting || overLimit}
                  onClick={() => setConfirmMode("reference")}
                >
                  {`2. Прогнать цепочки (~${usd(estimate)})`}
                </Button>
                <Button disabled={!directRunAllowed} onClick={() => setConfirmMode("direct")}>
                  {`Прогнать без эталона (~${usd(estimate)})`}
                </Button>
              </div>
              {referenceError && (
                <Alert
                  type="error"
                  message={referenceError}
                  showIcon
                  action={
                    <Button
                      size="small"
                      disabled={!file || !prompt || createReference.isLoading}
                      onClick={() =>
                        file &&
                        createReference.mutate({ photo: file, prompt, resolution })
                      }
                    >
                      Повторить
                    </Button>
                  }
                />
              )}
              {overLimit && (
                <Alert
                  type="error"
                  message={`Оценка прогона ${usd(estimate)} выше лимита ${usd(config?.limitUsd)} — выключите часть цепочек в конфигураторе`}
                  showIcon
                />
              )}
            </div>
          </div>

          {reference && (
            <div className={css.referenceRow}>
              <div className={css.referenceCell}>
                <Image src={reference.sourceUrl} alt="Исходник" className={css.referenceThumb} />
                <div className={css.stepCaption}>исходник</div>
              </div>
              <div className={css.referenceCell}>
                <Image src={reference.resultUrl} alt="Эталон" className={css.referenceThumb} />
                <div className={css.stepCaption}>
                  эталон · {referenceCached ? "из кэша (без оплаты)" : usd(reference.costUsd)}
                  {" · "}
                  <button
                    type="button"
                    className={css.linkButton}
                    onClick={() =>
                      file &&
                      createReference.mutate({
                        photo: file,
                        prompt,
                        resolution,
                        force: true,
                      })
                    }
                  >
                    перегенерировать (платно)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {runData?.run && (
        <div className={css.section}>
          <RunView run={runData.run} canRun={isRunner} />
        </div>
      )}
      {!runData?.run && !isRunner && (
        <div className={css.pageSubtitle}>Выберите прогон во вкладке «История».</div>
      )}
    </>
  );

  const configuratorTabContent = config ? (
    <ChainConfigurator
      chains={config.chains}
      models={config.models}
      canEdit={isRunner}
    />
  ) : null;

  const historyTabContent = (
    <Table
      rowKey="id"
      columns={historyColumns}
      dataSource={runsData?.runs ?? []}
      pagination={{ pageSize: 10 }}
      size="small"
      onRow={(item) => ({
        onClick: () => {
          setActiveRunId(item.id);
          setActiveTab("run");
        },
        className: css.historyRow,
      })}
    />
  );

  return (
    <div className={css.page}>
      <h1 className={css.pageTitle}>Model Explorer</h1>
      <div className={css.pageSubtitle}>
        Сравнение цепочек Replicate против эталона {config?.reference.model ?? "…"} по
        цене и качеству. Лимит одного прогона — {config ? usd(config.limitUsd) : "…"}.
      </div>

      {!isRunner && (
        <Alert
          className={css.readOnlyBanner}
          type="info"
          message="Режим просмотра: запускать обработку может только админ. История и результаты доступны."
          showIcon
        />
      )}

      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as typeof activeTab)}
        items={[
          { key: "run", label: "Прогон", children: runTabContent },
          { key: "configurator", label: "Конфигуратор цепочек", children: configuratorTabContent },
          {
            key: "history",
            label: `История (${runsData?.runs.length ?? 0})`,
            children: historyTabContent,
          },
        ]}
      />

      <Modal
        title={
          confirmMode === "direct"
            ? "Подтверждение платного прогона без эталона"
            : "Подтверждение платного прогона"
        }
        open={confirmMode !== null}
        onOk={() => {
          if (estimate === undefined) return;
          if (confirmMode === "direct") {
            if (file) startRunDirect.mutate({ photo: file, prompt, confirmEstimateUsd: estimate });
          } else if (reference) {
            startRun.mutate({ referenceId: reference.id, confirmEstimateUsd: estimate });
          }
        }}
        onCancel={() => setConfirmMode(null)}
        okButtonName={`Запустить за ${usd(estimate)}`}
        cancelButtonName="Отмена"
        isLoading={runStarting}
      >
        <p>
          Будут прогнаны включённые цепочки набора (
          {config?.chains.filter((c) => c.enabled).length ?? "…"} шт.) — разрешение у
          каждого шага своё, из конфигуратора. Расчётная стоимость — <b>{usd(estimate)}</b>{" "}
          (лимит {usd(config?.limitUsd)}).{" "}
          {confirmMode === "direct"
            ? `Эталон ${config?.reference.model ?? "nano-banana-pro"} не запрашивается — результаты сравниваются с исходником.`
            : "Эталон уже оплачен и повторно не тарифицируется."}
        </p>
        <ul className={css.confirmList}>
          {config?.chains
            .filter((chain) => chain.enabled)
            .map((chain) => (
              <li key={chain.id}>
                {chain.title} — {usd(chain.estimateUsd)}
              </li>
            ))}
        </ul>
      </Modal>
    </div>
  );
};

export default ModelExplorerPage;
