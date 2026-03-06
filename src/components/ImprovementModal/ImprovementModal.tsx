import React, { FC, useEffect, useState } from "react";
import css from "./index.module.css";
import Modal from "../Modal/Modal";
import {
  getGetPhotosAlbumAlbumIdQueryKey,
  useGetPhotosId,
  useGetPrompts,
  usePostPhotosAddlayer,
  usePostPhotosIdRevert,
  usePostPhotosImprovement,
} from "../../apiV2/a7-service";
import { defaultApiAxiosParams } from "../../api/helpers";
import { showNotification } from "../ShowNotification";
import Button from "../Button/Button";
import Select from "../Select/Select";
import { Spin, Tooltip } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import {
  ReactCompareSlider,
  ReactCompareSliderImage,
} from "react-compare-slider";
import cn from "classnames";
import { useQueryClient } from "react-query";
import { useParams } from "react-router-dom";
import type { PromptResponseHistoryItem } from "../../apiV2/a7-service/model/promptResponseHistoryItem";

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
  const [improvementInProgress, setImprovementInProgress] = useState(false);
  const [initialCurrentUrl, setInitialCurrentUrl] = useState("");
  const [selectedPromptId, setSelectedPromptId] = useState<string | undefined>();
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);

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

  const { isLoading: isAddlayerLoading, mutateAsync: addLayerPhoto } =
    usePostPhotosAddlayer({
      axios: defaultApiAxiosParams,
    });

  const { isLoading: isRevertLoading, mutateAsync: revertPhoto } =
    usePostPhotosIdRevert({
      axios: defaultApiAxiosParams,
    });

  const { data: promptsData, isLoading: isPromptsLoading } = useGetPrompts({
    axios: defaultApiAxiosParams,
  });

  const promptsList = promptsData?.data ?? [];
  const selectedPrompt = promptsList.find((p) => p.id === selectedPromptId);
  const promptHistory = selectedPrompt?.history ?? [];
  const bodyForRequest =
    selectedVersion != null
      ? promptHistory.find((h) => h.promptVersion === selectedVersion)
          ?.promptBody ?? selectedPrompt?.body
      : selectedPrompt?.body;

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
    if (selectedPromptId && bodyForRequest != null) {
      addLayerPhoto({
        data: {
          photoId,
          prompt: bodyForRequest,
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

  const handleRevertPhoto = () => {
    revertPhoto({
      id: photoId,
    })
      .then(() => {
        void queryClient.invalidateQueries({
          queryKey: getGetPhotosAlbumAlbumIdQueryKey(albumId ?? ""),
        });
      })
      .catch(() => {
        showNotification({
          message: "Произошла ошибка при откате фото",
          type: "error",
        });
      });
  };

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
            <div className={css.modelSelectContainer}>
              <Select
                label="Промпт"
                placeholder="Выберите промпт"
                value={selectedPromptId}
                onChange={(value) => {
                  setSelectedPromptId(value ?? undefined);
                  const prompt = promptsList.find((p) => p.id === value);
                  const history = prompt?.history ?? [];
                  setSelectedVersion(
                    history.length > 0
                      ? history[history.length - 1].promptVersion
                      : null
                  );
                }}
                options={promptsList.map((p) => ({
                  label: p.title ?? "",
                  value: p.id ?? "",
                }))}
                disabled={
                  improvementInProgress ||
                  isImprovementLoading ||
                  isAddlayerLoading ||
                  isPhotoLoading ||
                  isRevertLoading
                }
                loading={isPromptsLoading}
              />
              {selectedPromptId && promptHistory.length > 0 && (
                <div className={css.versionSelect}>
                  <Select
                    label="Версия"
                    placeholder="Выберите версию"
                    value={selectedVersion}
                    onChange={(value) => setSelectedVersion(value ?? null)}
                    options={promptHistory.map(
                      (item: PromptResponseHistoryItem) => ({
                        label: item.promptVersion,
                        value: item.promptVersion,
                      })
                    )}
                    optionRender={({ data }) => {
                      const item = promptHistory.find(
                        (h) => h.promptVersion === data.value
                      );
                      return (
                        <Tooltip
                          title={item?.promptBody ?? ""}
                          placement="left"
                          className={css.tooltip}
                        >
                          <span>{item?.promptVersion ?? data.value}</span>
                        </Tooltip>
                      );
                    }}
                    disabled={
                      improvementInProgress ||
                      isImprovementLoading ||
                      isAddlayerLoading ||
                      isPhotoLoading ||
                      isRevertLoading
                    }
                  />
                </div>
              )}
            </div>
            <div className={css.bottomContainerInner}>
              {hasImprovedVersion && (
                <Button
                  onClick={handleRevertPhoto}
                  disabled={
                    improvementInProgress ||
                    isImprovementLoading ||
                    isAddlayerLoading ||
                    isPhotoLoading ||
                    isRevertLoading
                  }
                  loading={isRevertLoading}
                >
                  Вернуть к оригиналу
                </Button>
              )}
              <Button
                onClick={handleImprovePhoto}
                disabled={
                  improvementInProgress ||
                  isImprovementLoading ||
                  isAddlayerLoading ||
                  isPhotoLoading ||
                  isRevertLoading ||
                  !selectedPromptId ||
                  bodyForRequest == null
                }
                loading={
                  improvementInProgress ||
                  isImprovementLoading ||
                  isAddlayerLoading ||
                  isPhotoLoading
                }
              >
                {improvementInProgress
                  ? "Идёт обработка фото"
                  : hasImprovedVersion
                    ? "Обработать заново"
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
