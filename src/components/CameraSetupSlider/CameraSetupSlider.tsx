import React, { useState } from "react";
import css from "./index.module.css";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { CameraSetupStep } from "../../pages/Administration/cameraSetupSteps";
import cn from "classnames";
import Button from "../Button/Button";

type Props = {
  steps: CameraSetupStep[];
  onClose?: () => void;
};

const CameraSetupSlider: React.FC<Props> = ({ steps }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const currentStep = steps[currentStepIndex];

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  if (!currentStep) {
    return null;
  }

  return (
    <div className={css.sliderContainer}>
      <div className={css.header}>
        <div className={css.stepIndicator}>
          Шаг {currentStep.id} из {steps.length}
        </div>
      </div>

      <div className={css.content}>
        <div className={css.imageContainer}>
          <img
            src={currentStep.imagePath}
            className={css.stepImage}
            alt=""
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "";
            }}
          />
        </div>

        <div className={css.textContainer}>
          <div className={css.stepDescription}>
            {currentStep.description.split("\n").map((line, index) => (
              <React.Fragment key={index}>
                {line}
                {index < currentStep.description.split("\n").length - 1 && (
                  <br />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className={css.navigation}>
        <Button
          className={cn(css.navButton, css.navButtonLeft)}
          onClick={handlePrevious}
          disabled={isFirstStep}
          aria-label="Предыдущий шаг"
          size="small"
        >
          <LeftOutlined />
          <span>Назад</span>
        </Button>

        <div className={css.stepDots}>
          {steps.map((_, index) => (
            <button
              key={index}
              className={cn(
                css.dot,
                index === currentStepIndex && css.dotActive
              )}
              onClick={() => setCurrentStepIndex(index)}
              aria-label={`Перейти к шагу ${index + 1}`}
            />
          ))}
        </div>

        <Button
          className={cn(css.navButton, css.navButtonRight)}
          onClick={handleNext}
          disabled={isLastStep}
          aria-label="Следующий шаг"
          size="small"
        >
          <span>Далее</span>
          <RightOutlined />
        </Button>
      </div>
    </div>
  );
};

export default CameraSetupSlider;

