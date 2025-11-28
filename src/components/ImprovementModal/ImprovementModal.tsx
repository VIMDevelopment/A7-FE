import React, { FC, useMemo, useState } from "react";
import css from "./index.module.css";
import Modal from "../Modal/Modal";
import {
  useGetPhotosId,
  useGetPrompts,
  usePostPhotosImprovement,
} from "../../apiV2/a7-service";
import { defaultApiAxiosParams } from "../../api/helpers";
import { showNotification } from "../ShowNotification";
import Select from "../Select/Select";
import Button from "../Button/Button";
import { Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import {
  ReactCompareSlider,
  ReactCompareSliderImage,
} from "react-compare-slider";
import cn from "classnames";
import InputTextArea from "../TextArea/Input";

type Props = {
  photoId: string;
  isOpen: boolean;
  onOk: () => void;
  onCancel: () => void;
};

const ImprovementModal: FC<Props> = ({ photoId, isOpen, onOk, onCancel }) => {
  const [promptIds, setPromptIds] = useState<string[]>([]);
  const [customPromptText, setCustomPromptText] = useState<string>("");
  const [improvementInProgress, setImprovementInProgress] = useState(false);

  const {
    data: photoData,
    isLoading: isPhotoLoading,
    refetch: refetchPhoto,
  } = useGetPhotosId(photoId, {
    axios: defaultApiAxiosParams,
    query: {
      onError: () => {
        showNotification({
          message: "Произошла ошибка при загрузке фото",
          type: "error",
        });
      },
    },
  });

  const { data: promptsData, isLoading: isPromptsLoading } = useGetPrompts({
    axios: defaultApiAxiosParams,
    query: {
      onError: () => {
        showNotification({
          message: "Произошла ошибка при загрузке списка промптов",
          type: "error",
        });
      },
    },
  });

  const { isLoading: isImprovementLoading, mutateAsync: improvePhoto } =
    usePostPhotosImprovement({
      axios: defaultApiAxiosParams,
    });

  const handleImprovePhoto = () => {
    improvePhoto({
      data: {
        photoIds: [photoId],
        promptId: promptIds[0],
      },
    })
      .then(() => {
        setImprovementInProgress(true);
        setTimeout(() => {
          refetchPhoto();
          showNotification({
            message: "Фото улучшено",
            type: "success",
          });
          setImprovementInProgress(false);
        }, 10000);
      })
      .catch(() => {
        showNotification({
          message: "Произошла ошибка при улучшении фото",
          type: "error",
        });
      });
  };

  const options = useMemo(
    () =>
      (promptsData?.data ?? []).map((item) => ({
        key: item.id,
        value: item.id,
        label: item.title,
      })),
    [promptsData]
  );

  const originalPhoto = photoData?.data.default.original;

  const improvedPhoto = photoData?.data.current.original;

  return (
    <>
      {isOpen && (
        <Modal
          customRootClassName={css.improveModal}
          title={"Улучшение фото"}
          open={isOpen}
          destroyOnHidden
          onOk={onOk}
          onCancel={onCancel}
          isLoading={isPhotoLoading}
          withFooter={false}
          blur
          style={{ top: 20 }}
        >
          <div className={css.beforeAfterText}>
            <span>До</span>
            <span>После</span>
          </div>
          <div className={css.improvePhotoImgContainer}>
            <ReactCompareSlider
              className={cn(
                css.sliderInModal,
                improvementInProgress && css.filter
              )}
              itemOne={<ReactCompareSliderImage src={originalPhoto} />}
              itemTwo={<ReactCompareSliderImage src={improvedPhoto} />}
              position={50}
            />

            {improvementInProgress && (
              <div className={css.spinnerOverlay}>
                <Spin
                  indicator={
                    <LoadingOutlined
                      spin
                      style={{ color: "white", fontSize: 80 }}
                    />
                  }
                />
              </div>
            )}
          </div>

          <div className={css.bottomContainer}>
            <div className={css.bottomContainerInner}>
              <Select
                label="Выберите что вы хотите улучшить"
                onChange={(value) => setPromptIds(value)}
                value={promptIds}
                placeholder="Выберите из списка"
                disabled={
                  isPromptsLoading ||
                  isImprovementLoading ||
                  improvementInProgress ||
                  isPhotoLoading
                }
                loading={isPromptsLoading}
                options={options}
                mode="multiple"
                size="large"
              />

              <InputTextArea
                label="Кастомный запрос"
                onChange={(e) => setCustomPromptText(e.target.value)}
                value={customPromptText}
                disabled={
                  improvementInProgress ||
                  isImprovementLoading ||
                  isPhotoLoading
                }
                placeholder="Введите запрос"
                autoSize={{ minRows: 2, maxRows: 2 }}
                count={{}}
              />

              <Button
                onClick={handleImprovePhoto}
                disabled={
                  (!promptIds.length && !customPromptText) ||
                  isPromptsLoading ||
                  improvementInProgress ||
                  isPhotoLoading
                }
                loading={
                  improvementInProgress ||
                  isImprovementLoading ||
                  isPhotoLoading
                }
              >
                {improvementInProgress
                  ? "Идёт улучшение фото"
                  : "Улучшить фото"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default ImprovementModal;
