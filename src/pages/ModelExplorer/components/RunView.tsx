import React, { FC, useState } from "react";
import { Image, Spin, Table, Tag, Tooltip } from "antd";
import { LoadingOutlined, SwapOutlined } from "@ant-design/icons";
import { ExplorerChain, ExplorerRun, ExplorerStep } from "../../../api/explorerApi";
import Button from "../../../components/Button/Button";
import CompareModal from "./CompareModal";
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

type Props = { run: ExplorerRun };

/**
 * R-13.3: таблица прогона — по строке на цепочку: исходник → каждый промежуточный
 * шаг → конечный результат → цены → имена моделей. R-14: сравнение с эталоном слайдером,
 * промежуточные шаги открываются в полном размере (antd Image preview).
 */
const RunView: FC<Props> = ({ run }) => {
  const [compare, setCompare] = useState<{ title: string; resultUrl: string } | null>(null);

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
                <Image
                  src={step.imageUrl}
                  alt={step.model}
                  className={css.stepThumb}
                />
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
      width: 130,
      render: (_: unknown, chain: ExplorerChain) => {
        const estimate = chain.steps.reduce((sum, s) => sum + s.estimateUsd, 0);
        return (
          <div>
            <div>оценка {usd(estimate)}</div>
            <div className={css.factPrice}>факт {usd(chain.factUsd)}</div>
          </div>
        );
      },
    },
    {
      title: "Сравнение",
      key: "compare",
      width: 150,
      render: (_: unknown, chain: ExplorerChain) => {
        const finalStep = [...chain.steps].reverse().find((s) => s.status === "done");
        if (chain.status !== "done" || !finalStep?.imageUrl) {
          return <Tag color={STEP_STATUS_COLOR[chain.status === "failed" ? "failed" : "pending"]}>
            {chain.status === "failed" ? "цепочка упала" : "ждём результат"}
          </Tag>;
        }
        return (
          <Button
            onClick={() =>
              setCompare({ title: chain.title, resultUrl: finalStep.imageUrl! })
            }
          >
            <SwapOutlined /> С эталоном
          </Button>
        );
      },
    },
  ];

  const statusTag = RUN_STATUS_TAG[run.status];

  return (
    <div className={css.runView}>
      <div className={css.runHeader}>
        <Tag color={statusTag.color}>{statusTag.label}</Tag>
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
      <CompareModal
        open={Boolean(compare)}
        onClose={() => setCompare(null)}
        title={`${compare?.title ?? ""} — сравнение с эталоном`}
        resultUrl={compare?.resultUrl ?? ""}
        referenceUrl={run.referenceUrl}
      />
    </div>
  );
};

export default RunView;
