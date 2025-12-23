import React, { FC, useEffect, useState } from "react";
import css from "./index.module.css";
import Modal from "../Modal/Modal";
import {
  useGetPhotosId,
  usePostPhotosImprovement,
  usePostPhotosImprovementcustom,
} from "../../apiV2/a7-service";
import { defaultApiAxiosParams } from "../../api/helpers";
import { showNotification } from "../ShowNotification";
import Button from "../Button/Button";
import { Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import {
  ReactCompareSlider,
  ReactCompareSliderImage,
} from "react-compare-slider";
import cn from "classnames";
import { useQueryClient } from "react-query";
import { useParams } from "react-router-dom";
import InputTextArea from "../TextArea/Input";

type Props = {
  photoId: string;
  hasImprovedVersion: boolean;
  isOpen: boolean;
  onOk: () => void;
  onCancel: () => void;
};

const ImprovementModal: FC<Props> = ({
  photoId,
  isOpen,
  hasImprovedVersion,
  onOk,
  onCancel,
}) => {
  const [customPromptText, setCustomPromptText] = useState<string>("");
  const [improvementInProgress, setImprovementInProgress] = useState(false);
  const [initialCurrentUrl, setInitialCurrentUrl] = useState("");

  const { albumId } = useParams();
  const queryClient = useQueryClient();

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

  const { isLoading: isImprovementLoading, mutateAsync: improvePhoto } =
    usePostPhotosImprovement({
      axios: defaultApiAxiosParams,
    });

  const {
    isLoading: isImprovementCustomLoading,
    mutateAsync: improvePhotoCustom,
  } = usePostPhotosImprovementcustom({
    axios: defaultApiAxiosParams,
  });

  useEffect(() => {
    if (!improvementInProgress) return;

    const interval = setInterval(() => {
      const improvedPhotoUrl = photoData?.data.current?.original;
      const isOldImprovedPhotoUrl = improvedPhotoUrl === initialCurrentUrl;

      if (!improvedPhotoUrl || isOldImprovedPhotoUrl) {
        refetchPhoto();
      } else {
        clearInterval(interval);
        showNotification({
          message: "Фото улучшено",
          type: "success",
        });
        void queryClient.invalidateQueries({
          queryKey: [`/photos/album/${albumId}`],
        });
        setInitialCurrentUrl(photoData.data.current?.original ?? "");
        setImprovementInProgress(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [improvementInProgress, photoData, initialCurrentUrl]);

  const handleImprovePhoto = () => {
    if (customPromptText.length > 0) {
      improvePhotoCustom({
        data: {
          photoid: photoId,
          userprompt: customPromptText,
        },
      })
        .then(() => {
          setInitialCurrentUrl(photoData?.data.current?.original ?? "");
          setImprovementInProgress(true);
        })
        .catch(() => {
          showNotification({
            message: "Произошла ошибка при улучшении фото",
            type: "error",
          });
        });
    } else {
      improvePhoto({
        data: {
          photoIds: [photoId],
        },
      })
        .then(() => {
          setInitialCurrentUrl(photoData?.data.current?.original ?? "");
          setImprovementInProgress(true);
        })
        .catch(() => {
          showNotification({
            message: "Произошла ошибка при улучшении фото",
            type: "error",
          });
        });
    }
  };

  // const modelOptions = useMemo(
  //   () =>
  //     (modelsData?.data ?? []).map((item) => ({
  //       key: item.id,
  //       value: item.id,
  //       label: item.title,
  //     })),
  //   [modelsData]
  // );

  // const promptsOptions = useMemo(
  //   () =>
  //     (promptsData?.data ?? []).map((item) => ({
  //       key: item.id,
  //       value: item.id,
  //       label: item.title,
  //     })),
  //   [promptsData]
  // );

  const originalPhoto = photoData?.data.default.original;

  const improvedPhoto = photoData?.data.current?.original;

  return (
    <>
      {isOpen && (
        <Modal
          customRootClassName={css.improveModal}
          title={
            hasImprovedVersion ? "Повторная обработка фото" : "Улучшение фото"
          }
          open={isOpen}
          destroyOnHidden
          onOk={onOk}
          onCancel={onCancel}
          isLoading={isPhotoLoading}
          withFooter={false}
          blur
          style={{ top: 20 }}
        >
          {hasImprovedVersion && (
            <div className={css.beforeAfterText}>
              <span>Оригинал</span>
              <span>Улучшенная версия</span>
            </div>
          )}
          <div className={css.improvePhotoImgContainer}>
            {hasImprovedVersion ? (
              <ReactCompareSlider
                className={cn(
                  css.sliderInModal,
                  improvementInProgress && css.filter
                )}
                itemOne={<ReactCompareSliderImage src={originalPhoto} />}
                itemTwo={<ReactCompareSliderImage src={improvedPhoto} />}
                position={50}
              />
            ) : (
              <img
                src={originalPhoto}
                className={cn(
                  css.imgInModal,
                  improvementInProgress && css.filter
                )}
              />
            )}

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
              <InputTextArea
                label="Кастомный запрос"
                onChange={(e) => setCustomPromptText(e.target.value)}
                value={customPromptText}
                disabled={
                  improvementInProgress ||
                  isImprovementLoading ||
                  isImprovementCustomLoading ||
                  isPhotoLoading
                }
                placeholder="Введите запрос"
                autoSize={{ minRows: 2, maxRows: 2 }}
                count={{}}
              />

              <div className={css.info}>
                P.S. Эффекты всегда применяются только к оригиналу. При
                повторной обработке предыдущая обработанная версия автоматически
                заменяется.
              </div>

              <Button
                onClick={handleImprovePhoto}
                disabled={
                  improvementInProgress ||
                  isImprovementLoading ||
                  isImprovementCustomLoading ||
                  isPhotoLoading
                }
                loading={
                  improvementInProgress ||
                  isImprovementLoading ||
                  isImprovementCustomLoading ||
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
