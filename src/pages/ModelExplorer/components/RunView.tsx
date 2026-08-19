import React, { FC, useState } from "react";
import { Image, Spin, Table, Tag, Tooltip } from "antd";
import {
  EyeOutlined,
  LoadingOutlined,
  RedoOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import { useQueryClient } from "react-query";
import {
  ExplorerChain,
  ExplorerRun,
  ExplorerStep,
  explorerRunKey,
  useRetryChain,
} from "../../../api/explorerApi";
import Button from "../../../components/Button/Button";
import { showNotification } from "../../../components/ShowNotification";
import ChainCarouselModal from "./ChainCarouselModal";
import css from "../index.module.css";

const usd = (value?: number) =>
  value === undefined ? "—" : `$${value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "")}`;

const RUN_STATUS_TAG: Record<ExplorerRun["status"], { color: string; label: string }> = {
  running: { color: "processing", label: "Выполняется" },
  done: { color: "success", label: "Завершён" },
  partial: { color: "warning", label: "Частично (есть упавшие цепочки)" },
  failed: { color: "error", label: "Упал" },
};

const STEP_STATUS_COLOR: Record<ExplorerStep["status"], string> = {
  pending: "default",
  running: "processing",
  done: "success",
  failed: "error",
  skipped: "default",
};

/** Короткое имя модели без владельца: bytedance/seedream-4 → seedream-4. */
const shortModel = (model: string) => model.split("/")[1] ?? model;

type CarouselState = { chain: ExplorerChain; initialSlide: number } | null;

type Props = {
  run: ExplorerRun;
  /** админ: доступны платные действия (перезапуск упавшей цепочки) */
  canRun: boolean;
};

/**
 * R-13.3: таблица прогона — по строке на цепочку. R-14: карусель шагов в большом
 * масштабе (последний кадр — слайдер с эталоном). R-13.6: перезапуск упавшей цепочки.
 */
const RunView: FC<Props> = ({ run, canRun }) => {
  const [carousel, setCarousel] = useState<CarouselState>(null);
  const queryClient = useQueryClient();

  const retryChain = useRetryChain({
    onSuccess: () => {
      showNotification({ type: "success", message: "Цепочка перезапущена" });
      void queryClient.invalidateQueries(explorerRunKey(run.id));
    },
  });

  const chainEstimate = (chain: ExplorerChain) =>
    chain.steps.reduce((sum, s) => sum + s.estimateUsd, 0);

  const columns = [
    {
      title: "Цепочка",
      dataIndex: "title",
      key: "title",
      width: 220,
      render: (_: unknown, chain: ExplorerChain) => (
        <div>
          <div className={css.chainTitle}>{chain.title}</div>
          <div className={css.chainModels}>
            {chain.steps.map((s) => shortModel(s.model)).join(" → ")}
          </div>
          {chain.error && <div className={css.chainError}>{chain.error}</div>}
        </div>
      ),
    },
    {
      title: "Шаги (исходник → результат)",
      key: "steps",
      render: (_: unknown, chain: ExplorerChain) => (
        <div className={css.stepsRow}>
          <div className={css.stepCell}>
            <Image src={run.sourceUrl} alt="Исходник" className={css.stepThumb} />
            <div className={css.stepCaption}>исходник</div>
          </div>
          {chain.steps.map((step, i) => (
            <div className={css.stepCell} key={`${chain.chainId}-${i}`}>
              {step.status === "done" && step.imageUrl ? (
                <Image src={step.imageUrl} alt={step.model} className={css.stepThumb} />
              ) : step.status === "running" ? (
                <div className={css.stepPlaceholder}>
                  <Spin indicator={<LoadingOutlined spin />} />
                </div>
              ) : (
                <div className={css.stepPlaceholder}>
                  <Tag color={STEP_STATUS_COLOR[step.status]}>
                    {step.status === "failed" ? "ошибка" : "ожидание"}
                  </Tag>
                </div>
              )}
              <div className={css.stepCaption}>
                <Tooltip title={`${step.model} · оценка ${usd(step.estimateUsd)}`}>
                  {shortModel(step.model)}
                </Tooltip>
                <div className={css.stepPrice}>
                  {step.cached ? "из кэша" : usd(step.factUsd ?? step.estimateUsd)}
                </div>
                {step.error && (
                  <Tooltip title={step.error}>
                    <div className={css.stepError}>ошибка шага</div>
                  </Tooltip>
                )}
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: "Цена",
      key: "price",
      width: 140,
      render: (_: unknown, chain: ExplorerChain) => (
        <div>
          <div>оценка {usd(chainEstimate(chain))}</div>
          <div className={css.factPrice}>факт {usd(chain.factUsd)}</div>
          {chain.wastedUsd ? (
            <Tooltip title="Потрачено в неудачных попытках до перезапуска — входит в факт прогона">
              <div className={css.wastedPrice}>+ неудачные {usd(chain.wastedUsd)}</div>
            </Tooltip>
          ) : null}
        </div>
      ),
    },
    {
      title: "Действия",
      key: "actions",
      width: 190,
      render: (_: unknown, chain: ExplorerChain) => {
        const doneSteps = chain.steps.filter((s) => s.status === "done" && s.imageUrl);
        return (
          <div className={css.actionsCol}>
            {doneSteps.length > 0 && (
              <Button onClick={() => setCarousel({ chain, initialSlide: 0 })}>
                <EyeOutlined /> Смотреть
              </Button>
            )}
            {chain.status === "done" && (
              <Button onClick={() => setCarousel({ chain, initialSlide: -1 })}>
                <SwapOutlined /> С эталоном
              </Button>
            )}
            {chain.status === "failed" && canRun && (
              <Button
                onClick={() =>
                  retryChain.mutate({ runId: run.id, chainId: chain.chainId })
                }
                loading={retryChain.isLoading}
              >
                <RedoOutlined /> Перезапустить ({usd(chainEstimate(chain))})
              </Button>
            )}
            {chain.status === "failed" && !canRun && (
              <Tag color="error">цепочка упала</Tag>
            )}
            {chain.status === "running" && <Tag color="processing">выполняется</Tag>}
          </div>
        );
      },
    },
  ];

  const statusTag = RUN_STATUS_TAG[run.status];
  const finishedChains = run.chains.filter(
    (c) => c.status === "done" || c.status === "failed"
  ).length;

  return (
    <div className={css.runView}>
      <div className={css.runHeader}>
        <Tag color={statusTag.color}>{statusTag.label}</Tag>
        {run.status === "running" && (
          <span className={css.runProgress}>
            <Spin indicator={<LoadingOutlined spin />} size="small" />
            готово {finishedChains} из {run.chains.length} цепочек
          </span>
        )}
        <span className={css.runMeta}>
          {run.resolution} · промпт: «{run.prompt}» · оценка {usd(run.estimateUsd)} · факт{" "}
          {usd(run.factUsd)}
        </span>
      </div>
      <Table
        rowKey="chainId"
        columns={columns}
        dataSource={run.chains}
        pagination={false}
        size="small"
        scroll={{ x: true }}
      />
      <ChainCarouselModal
        open={Boolean(carousel)}
        onClose={() => setCarousel(null)}
        chain={carousel?.chain ?? null}
        sourceUrl={run.sourceUrl}
        referenceUrl={run.referenceUrl}
        initialSlide={carousel?.initialSlide ?? 0}
      />
    </div>
  );
};

export default RunView;
