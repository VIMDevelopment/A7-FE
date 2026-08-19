import React, { FC, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Image, Select, Table, Tag, Upload } from "antd";
import type { UploadFile } from "antd";
import { InboxOutlined } from "@ant-design/icons";
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
} from "../../api/explorerApi";
import { canRunExplorer } from "./access";
import RunView from "./components/RunView";
import PromptPicker from "./components/PromptPicker";
import ChainConfigurator from "./components/ChainConfigurator";
import css from "./index.module.css";

const usd = (value?: number) =>
  value === undefined ? "—" : `$${value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "")}`;

/**
 * Model Explorer (R-11…R-16): сравнение цепочек Replicate против эталона
 * nano-banana-pro по цене и качеству. Просмотр — админ и руководители,
 * запуск платной обработки — только админ (R-11.3).
 */
const ModelExplorerPage: FC = () => {
  const { data: profile } = useProfile();
  const isRunner = canRunExplorer(profile?.roles);
  const queryClient = useQueryClient();

  const { data: config } = useExplorerConfig();

  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [resolution, setResolution] = useState<ExplorerResolution>("2K");
  const [reference, setReference] = useState<ExplorerReference | null>(null);
  const [referenceCached, setReferenceCached] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
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
      }
      prevRunStatusRef.current = data.run.status;
    },
  });

  const createReference = useCreateReference({
    onSuccess: ({ reference: ref, cached }) => {
      setReference(ref);
      setReferenceCached(cached);
      showNotification({
        type: "success",
        message: cached
          ? "Эталон найден в кэше — повторная оплата не нужна"
          : `Эталон получен, стоимость ${usd(ref.costUsd)}`,
      });
    },
  });

  const startRun = useStartRun({
    onSuccess: ({ run }) => {
      setConfirmOpen(false);
      setActiveRunId(run.id);
      void queryClient.invalidateQueries(explorerRunsKey, { exact: true });
    },
  });

  const estimate = config?.estimateUsd?.[resolution];
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
      reference.prompt === prompt.trim() &&
      reference.resolution === resolution
  );

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
      { title: "Разрешение", dataIndex: "resolution", key: "resolution", width: 110 },
      {
        title: "Статус",
        dataIndex: "status",
        key: "status",
        width: 120,
        render: (status: string) => <Tag>{status}</Tag>,
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

      {isRunner && (
        <div className={css.newRunCard}>
          <h2 className={css.sectionTitle}>Новый прогон</h2>
          <div className={css.newRunGrid}>
            <div className={css.uploadCol}>
              {filePreview ? (
                <div className={css.previewWrap}>
                  <img src={filePreview} alt="Исходник" className={css.previewImg} />
                  <Button onClick={() => { setFile(null); setFilePreview(null); setReference(null); }}>
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
                Промпт (один на прогон, из общего справочника — как в модалке улучшения)
              </label>
              <PromptPicker
                disabled={createReference.isLoading || startRun.isLoading}
                onPromptBodyChange={(body) => setPrompt(body ?? "")}
              />
              <label className={css.label}>Целевое разрешение</label>
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
                  disabled={!file || !prompt.trim() || createReference.isLoading}
                  onClick={() =>
                    file &&
                    createReference.mutate({ photo: file, prompt: prompt.trim(), resolution })
                  }
                >
                  {createReference.isLoading
                    ? "Обрабатываем эталон…"
                    : `1. Получить эталон (${usd(config?.reference.priceUsd[resolution])})`}
                </Button>
                <Button
                  disabled={!referenceMatchesForm || startRun.isLoading || overLimit}
                  onClick={() => setConfirmOpen(true)}
                >
                  {`2. Прогнать цепочки (~${usd(estimate)})`}
                </Button>
              </div>
              {overLimit && (
                <Alert
                  type="error"
                  message={`Оценка прогона ${usd(estimate)} выше лимита ${usd(config?.limitUsd)} — уменьшите набор цепочек в конфиге`}
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
                        prompt: prompt.trim(),
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

      {config && (
        <ChainConfigurator
          chains={config.chains}
          models={config.models}
          resolution={resolution}
          canEdit={isRunner}
        />
      )}

      {runData?.run && (
        <div className={css.section}>
          <h2 className={css.sectionTitle}>Прогон</h2>
          <RunView run={runData.run} canRun={isRunner} />
        </div>
      )}

      <div className={css.section}>
        <h2 className={css.sectionTitle}>История прогонов</h2>
        <Table
          rowKey="id"
          columns={historyColumns}
          dataSource={runsData?.runs ?? []}
          pagination={{ pageSize: 10 }}
          size="small"
          onRow={(item) => ({
            onClick: () => setActiveRunId(item.id),
            className: css.historyRow,
          })}
        />
      </div>

      <Modal
        title="Подтверждение платного прогона"
        open={confirmOpen}
        onOk={() =>
          reference &&
          estimate !== undefined &&
          startRun.mutate({ referenceId: reference.id, confirmEstimateUsd: estimate })
        }
        onCancel={() => setConfirmOpen(false)}
        okButtonName={`Запустить за ${usd(estimate)}`}
        cancelButtonName="Отмена"
        isLoading={startRun.isLoading}
      >
        <p>
          Будут прогнаны включённые цепочки набора (
          {config?.chains.filter((c) => c.enabled).length ?? "…"} шт.) в {resolution}.
          Расчётная стоимость — <b>{usd(estimate)}</b> (лимит {usd(config?.limitUsd)}).
          Эталон уже оплачен и повторно не тарифицируется. Состав меняется в конфигураторе.
        </p>
        <ul className={css.confirmList}>
          {config?.chains
            .filter((chain) => chain.enabled)
            .map((chain) => (
              <li key={chain.id}>
                {chain.title} — {usd(chain.estimateUsd[resolution])}
              </li>
            ))}
        </ul>
      </Modal>
    </div>
  );
};

export default ModelExplorerPage;
