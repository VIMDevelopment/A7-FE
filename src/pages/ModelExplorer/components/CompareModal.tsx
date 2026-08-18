import React, { FC } from "react";
import {
  ReactCompareSlider,
  ReactCompareSliderImage,
} from "react-compare-slider";
import Modal from "../../../components/Modal/Modal";
import css from "../index.module.css";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  /** результат цепочки (слева) */
  resultUrl: string;
  /** эталон nano-banana-pro (справа) */
  referenceUrl: string;
};

/**
 * R-14: слайдер-шторка «результат цепочки ⟷ эталон» — поведение как в модалке
 * улучшения фото (тот же react-compare-slider: обе картинки в одном кадре,
 * выровнены по зоне, слайдер открывает одну поверх другой).
 */
const CompareModal: FC<Props> = ({
  open,
  onClose,
  title,
  resultUrl,
  referenceUrl,
}) => {
  if (!open) return null;
  return (
    <Modal
      title={title}
      open={open}
      destroyOnHidden
      onCancel={onClose}
      withFooter={false}
      blur
      style={{ top: 20 }}
      width={900}
    >
      <div className={css.compareLabels}>
        <span>Цепочка</span>
        <span>Эталон (nano-banana-pro)</span>
      </div>
      <div className={css.compareContainer}>
        <ReactCompareSlider
          className={css.compareSlider}
          itemOne={<ReactCompareSliderImage src={resultUrl} alt="Результат цепочки" />}
          itemTwo={<ReactCompareSliderImage src={referenceUrl} alt="Эталон" />}
          position={50}
        />
      </div>
    </Modal>
  );
};

export default CompareModal;
