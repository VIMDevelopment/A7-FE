import React, { FC } from "react";
import { Carousel } from "antd";
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
  referenceUrl: string;
  /** с какого кадра открыть (последний = слайдер с эталоном) */
  initialSlide?: number;
};

/**
 * Карусель цепочки (R-14): исходник → каждый шаг в большом масштабе → последний кадр
 * со слайдером-шторкой «результат ⟷ эталон» (как в модалке улучшения фото).
 */
const ChainCarouselModal: FC<Props> = ({
  open,
  onClose,
  chain,
  sourceUrl,
  referenceUrl,
  initialSlide = 0,
}) => {
  if (!open || !chain) return null;

  const doneSteps = chain.steps.filter(
    (s) => s.status === "done" && s.imageUrl
  );
  const finalStep = doneSteps[doneSteps.length - 1];

  const frames: Array<{ key: string; caption: string; node: React.ReactNode }> = [
    {
      key: "source",
      caption: "Исходник",
      node: <img src={sourceUrl} alt="Исходник" className={css.carouselImg} />,
    },
    ...doneSteps.map((step, i) => ({
      key: `step-${i}`,
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
      caption: "Результат ⟷ эталон (nano-banana-pro)",
      node: (
        <ReactCompareSlider
          className={css.compareSlider}
          itemOne={<ReactCompareSliderImage src={finalStep.imageUrl} alt="Результат цепочки" />}
          itemTwo={<ReactCompareSliderImage src={referenceUrl} alt="Эталон" />}
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
            <div className={css.carouselCaption}>{frame.caption}</div>
            <div className={css.carouselFrame}>{frame.node}</div>
          </div>
        ))}
      </Carousel>
    </Modal>
  );
};

export default ChainCarouselModal;
