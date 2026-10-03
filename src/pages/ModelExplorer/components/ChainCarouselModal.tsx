import React, { FC } from "react";
import { Carousel } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import {
  ReactCompareSlider,
  ReactCompareSliderImage,
} from "react-compare-slider";
import Modal from "../../../components/Modal/Modal";
import { ExplorerChain } from "../../../api/explorerApi";
import css from "../index.module.css";

const usd = (value?: number) =>
  value === undefined ? "—" : `$${value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "")}`;

const shortModel = (model: string) => model.split("/")[1] ?? model;

type Props = {
  open: boolean;
  onClose: () => void;
  chain: ExplorerChain | null;
  sourceUrl: string;
  /** с чем сравнивать результат: эталон, у прогона без эталона — исходник (R-35.2) */
  compareUrl: string;
  compareLabel: "эталон" | "исходник";
  /** с какого кадра открыть (последний = слайдер сравнения) */
  initialSlide?: number;
  /** скачать картинку шага (индекс в chain.steps), R-37 */
  onDownloadStep?: (stepIndex: number) => void;
};

/**
 * Карусель цепочки (R-14): исходник → каждый шаг в большом масштабе → последний кадр
 * со слайдером-шторкой «результат ⟷ эталон» (как в модалке улучшения фото);
 * у прогона без эталона — «результат ⟷ исходник» (R-35.2).
 */
const ChainCarouselModal: FC<Props> = ({
  open,
  onClose,
  chain,
  sourceUrl,
  compareUrl,
  compareLabel,
  initialSlide = 0,
  onDownloadStep,
}) => {
  if (!open || !chain) return null;

  const doneSteps = chain.steps.filter(
    (s) => s.status === "done" && s.imageUrl
  );
  const finalStep = doneSteps[doneSteps.length - 1];

  const frames: Array<{
    key: string;
    caption: string;
    node: React.ReactNode;
    /** индекс шага для кнопки «Скачать» (у исходника и слайдера — нет) */
    stepIndex?: number;
  }> = [
    {
      key: "source",
      caption: "Исходник",
      node: <img src={sourceUrl} alt="Исходник" className={css.carouselImg} />,
    },
    // шаги цепочки идут по порядку и обрываются на упавшем — готовые шаги = её префикс
    ...doneSteps.map((step, i) => ({
      key: `step-${i}`,
      stepIndex: i,
      caption: `Шаг ${i + 1}: ${shortModel(step.model)} · ${
        step.cached ? "из кэша" : usd(step.factUsd ?? step.estimateUsd)
      }`,
      node: (
        <img
          src={step.imageUrl}
          alt={step.model}
          className={css.carouselImg}
        />
      ),
    })),
  ];

  if (finalStep?.imageUrl) {
    frames.push({
      key: "compare",
      caption:
        compareLabel === "эталон"
          ? "Результат ⟷ эталон (nano-banana-pro)"
          : "Результат ⟷ исходник (прогон без эталона)",
      node: (
        <ReactCompareSlider
          className={css.compareSlider}
          itemOne={<ReactCompareSliderImage src={finalStep.imageUrl} alt="Результат цепочки" />}
          itemTwo={
            <ReactCompareSliderImage
              src={compareUrl}
              alt={compareLabel === "эталон" ? "Эталон" : "Исходник"}
            />
          }
          position={50}
        />
      ),
    });
  }

  const startAt = Math.min(
    initialSlide < 0 ? frames.length - 1 : initialSlide,
    frames.length - 1
  );

  return (
    <Modal
      title={chain.title}
      open={open}
      destroyOnHidden
      onCancel={onClose}
      withFooter={false}
      blur
      style={{ top: 20 }}
      width={960}
    >
      <Carousel
        arrows
        dots
        infinite={false}
        initialSlide={startAt}
        className={css.chainCarousel}
      >
        {frames.map((frame) => (
          <div key={frame.key}>
            <div className={css.carouselCaption}>
              {frame.caption}
              {frame.stepIndex !== undefined && onDownloadStep && (
                <>
                  {" · "}
                  <button
                    type="button"
                    className={css.linkButton}
                    onClick={() => onDownloadStep(frame.stepIndex as number)}
                  >
                    <DownloadOutlined /> скачать
                  </button>
                </>
              )}
            </div>
            <div className={css.carouselFrame}>{frame.node}</div>
          </div>
        ))}
      </Carousel>
    </Modal>
  );
};

export default ChainCarouselModal;
