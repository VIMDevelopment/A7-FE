import React, { FC, useEffect, useRef, useState } from "react";
import css from "./index.module.css";
import Modal from "../Modal/Modal";
import {
  getGetPhotosAlbumAlbumIdQueryKey,
  useGetPhotosId,
  useGetPrompts,
  usePostPhotosAddlayer,
  usePostPhotosIdRevert,
  usePostPhotosImprove,
} from "../../apiV2/a7-service";
import { defaultApiAxiosParams } from "../../api/helpers";
import { showNotification } from "../ShowNotification";
import Button from "../Button/Button";
import Select from "../Select/Select";
import { Radio, Result, Spin, Tooltip } from "antd";
import {
  CloseCircleFilled,
  LoadingOutlined,
  StarFilled,
  StarOutlined,
} from "@ant-design/icons";
import {
  ReactCompareSlider,
  ReactCompareSliderImage,
} from "react-compare-slider";
import cn from "classnames";
import { useQueryClient } from "react-query";
import { useParams } from "react-router-dom";
import { useProfile } from "../../auth/auth";
import {
  useGetFavoritePrompts,
  usePostFavoritePrompt,
  useDeleteFavoritePrompt,
  getFavoritePromptsKey,
} from "../../api/favoritesApi";
import type { PromptResponseHistoryItem } from "../../apiV2/a7-service/model/promptResponseHistoryItem";
import type { PostPhotosAddlayerBody } from "../../apiV2/a7-service/model/postPhotosAddlayerBody";
import type { PostPhotosAddlayerBodyOutputResolution } from "../../apiV2/a7-service/model/postPhotosAddlayerBodyOutputResolution";
import type { PostPhotosImproveBody } from "../../apiV2/a7-service/model/postPhotosImproveBody";
import type { PhotoStatus } from "../../apiV2/a7-service/model/photoStatus";
import type { PhotoStatusOperation } from "../../apiV2/a7-service/model/photoStatusOperation";

const DEFAULT_OUTPUT_RESOLUTION: PostPhotosAddlayerBodyOutputResolution = "2K";
const POLLING_INTERVAL_MS = 1500;
const MAX_ATTEMPTS = 3;

const ERROR_MESSAGES: Record<string, { title: string; hint?: string }> = {
  E005: {
    title: "Нейросеть отклонила изображение",
    hint: "Возможные причины: защита авторских прав или политика безопасности контента. Попробуйте другое фото или другой промпт.",
  },
  STALE: {
    title: "Превышено время ожидания обработки",
    hint: "Сервис не ответил вовремя. Попробуйте повторить.",
  },
  UNKNOWN: {
    title: "Не удалось обработать фото",
  },
};

const OPERATION_PROCESSING_LABELS: Record<
  Exclude<PhotoStatusOperation, null>,
  string
> = {
  improve: "Идёт улучшение фото",
  addlayer: "Идёт добавление слоя",
};

const DEFAULT_PROCESSING_LABEL = "Идёт обработка фото";

type LastRequest =
  | { kind: "improve"; data: PostPhotosImproveBody }
  | { kind: "addlayer"; data: PostPhotosAddlayerBody };

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
  const [selectedPromptId, setSelectedPromptId] = useState<string | undefined>();
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [outputResolution, setOutputResolution] =
    useState<PostPhotosAddlayerBodyOutputResolution>(
      DEFAULT_OUTPUT_RESOLUTION,
    );

  const lastRequestRef = useRef<LastRequest | null>(null);
  const prevStatusRef = useRef<PhotoStatus | undefined>(undefined);

  useEffect(() => {
    if (isOpen) {
      setOutputResolution(DEFAULT_OUTPUT_RESOLUTION);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      prevStatusRef.current = undefined;
      lastRequestRef.current = null;
    }
  }, [isOpen]);

  const { albumId, projectId } = useParams();
  const queryClient = useQueryClient();

  // Филиал избранного: из URL альбома (projectId) либо fallback на первый филиал юзера
  // (нужно для контекстов без projectId в роуте, напр. Recognition).
  const { data: profile } = useProfile();
  const branchId = projectId ?? profile?.workplace?.[0];

  const { data: favoritesData } = useGetFavoritePrompts(branchId, {
    enabled: isOpen && !!branchId,
  });

  const { mutate: addFavorite } = usePostFavoritePrompt();
  const { mutate: removeFavorite } = useDeleteFavoritePrompt();

  const {
    data: photoData,
    isLoading: isPhotoLoading,
    refetch: refetchPhoto,
  } = useGetPhotosId(photoId, {
    axios: defaultApiAxiosParams,
    query: {
      enabled: isOpen && !!photoId,
      refetchInterval: (data) =>
        data?.data.status === "processing" ? POLLING_INTERVAL_MS : false,
      onError: () => {
        showNotification({
          message: "Произошла ошибка при загрузке фото",
          type: "error",
        });
      },
    },
  });

  const photo = photoData?.data;
  const status: PhotoStatus = photo?.status ?? "idle";
  const isProcessing = status === "processing";
  const isFailed = status === "failed";
  const statusAttempt = photo?.statusAttempt ?? null;
  const statusOperation = photo?.statusOperation ?? null;
  const statusErrorCode = photo?.statusErrorCode ?? null;
  const statusErrorMessage = photo?.statusErrorMessage ?? null;

  const { isLoading: isImprovementLoading, mutateAsync: improvePhoto } =
    usePostPhotosImprove({
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

  // Избранное филиала: множество id + отсортированный список (избранные сверху по title,
  // затем остальные в исходном порядке бэкенда — createdAt desc).
  const favoriteIdSet = new Set(favoritesData?.data.promptIds ?? []);
  const sortedPrompts = [
    ...promptsList
      .filter((p) => favoriteIdSet.has(p.id ?? ""))
      .sort((a, b) => (a.title ?? "").localeCompare(b.title ?? "")),
    ...promptsList.filter((p) => !favoriteIdSet.has(p.id ?? "")),
  ];

  const toggleFavorite = (
    promptId: string,
    e: React.MouseEvent<HTMLSpanElement>
  ) => {
    // Не даём клику по звезде выбрать пункт и закрыть дропдаун.
    e.stopPropagation();
    e.preventDefault();
    if (!branchId || !promptId) return;
    const variables = { projectId: branchId, promptId };
    const onSuccess = () =>
      queryClient.invalidateQueries(getFavoritePromptsKey(branchId));
    const onError = () =>
      showNotification({
        message: "Не удалось обновить избранное",
        type: "error",
      });
    if (favoriteIdSet.has(promptId)) {
      removeFavorite(variables, { onSuccess, onError });
    } else {
      addFavorite(variables, { onSuccess, onError });
    }
  };

  const selectedPrompt = promptsList.find((p) => p.id === selectedPromptId);
  const promptHistory = selectedPrompt?.history ?? [];
  const selectedHistoryItem =
    selectedVersion != null
      ? promptHistory.find((h) => h.promptVersion === selectedVersion)
      : undefined;
  const bodyForRequest =
    selectedVersion != null
      ? promptHistory.find((h) => h.promptVersion === selectedVersion)
          ?.promptBody ?? selectedPrompt?.body
      : selectedPrompt?.body;

  useEffect(() => {
    if (prevStatusRef.current === "processing" && status === "success") {
      showNotification({
        message: "Фото улучшено",
        type: "success",
      });
      void queryClient.invalidateQueries({
        queryKey: getGetPhotosAlbumAlbumIdQueryKey(albumId ?? ""),
      });
    }
    if (prevStatusRef.current === "processing" && status === "failed") {
      void queryClient.invalidateQueries({
        queryKey: getGetPhotosAlbumAlbumIdQueryKey(albumId ?? ""),
      });
    }
    prevStatusRef.current = status;
  }, [status, albumId, queryClient]);

  const invalidateAlbumList = () => {
    void queryClient.invalidateQueries({
      queryKey: getGetPhotosAlbumAlbumIdQueryKey(albumId ?? ""),
    });
  };

  const runImprove = (data: PostPhotosImproveBody) => {
    lastRequestRef.current = { kind: "improve", data };
    return improvePhoto({ data })
      .then(() => {
        void refetchPhoto();
        invalidateAlbumList();
      })
      .catch(() => {
        showNotification({
          message: "Произошла ошибка при улучшении фото",
          type: "error",
        });
      });
  };

  const runAddLayer = (data: PostPhotosAddlayerBody) => {
    lastRequestRef.current = { kind: "addlayer", data };
    return addLayerPhoto({ data })
      .then(() => {
        void refetchPhoto();
        invalidateAlbumList();
      })
      .catch(() => {
        showNotification({
          message: "Произошла ошибка при улучшении фото",
          type: "error",
        });
      });
  };

  const handleImprovePhoto = () => {
    if (selectedPromptId && bodyForRequest != null) {
      void runAddLayer({
        photoId,
        prompt: bodyForRequest,
        outputResolution,
      });
    } else {
      void runImprove({
        photoIds: [photoId],
        prompt: "mock",
      });
    }
  };

  const handleRetryLast = () => {
    const last = lastRequestRef.current;
    if (!last) {
      handleImprovePhoto();
      return;
    }
    if (last.kind === "addlayer") {
      void runAddLayer(last.data);
    } else {
      void runImprove(last.data);
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

  const processingLabel =
    (statusOperation && OPERATION_PROCESSING_LABELS[statusOperation]) ||
    DEFAULT_PROCESSING_LABEL;

  const getErrorInfo = (): { title: string; hint?: string } => {
    const code = statusErrorCode ?? "UNKNOWN";
    const fromDict = ERROR_MESSAGES[code];
    if (fromDict) {
      return {
        title: fromDict.title,
        hint: fromDict.hint ?? statusErrorMessage ?? undefined,
      };
    }
    return {
      title: ERROR_MESSAGES.UNKNOWN.title,
      hint: statusErrorMessage ?? undefined,
    };
  };

  const errorInfo = getErrorInfo();

  const allDisabled =
    isProcessing ||
    isImprovementLoading ||
    isAddlayerLoading ||
    isPhotoLoading ||
    isRevertLoading;

  const getMainButtonLabel = (): string => {
    if (isProcessing) {
      if (statusAttempt && statusAttempt > 1) {
        return `Повторная попытка (${statusAttempt}/${MAX_ATTEMPTS})…`;
      }
      return "Обработка фото…";
    }
    if (isFailed) {
      return hasImprovedVersion ? "Обработать заново" : "Улучшить заново";
    }
    return hasImprovedVersion ? "Обработать заново" : "Улучшить фото";
  };

  const isOverlayActive = isProcessing || isFailed;

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
                  isOverlayActive && css.filter,
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
                  isOverlayActive && css.filter,
                )}
              />
            )}

            {isProcessing && (
              <div className={css.statusOverlay}>
                <Spin
                  indicator={
                    <LoadingOutlined
                      spin
                      style={{ color: "white", fontSize: 80 }}
                    />
                  }
                />
                <div className={css.statusText}>{processingLabel}…</div>
                {statusAttempt != null && statusAttempt > 1 && (
                  <div className={css.statusAttempt}>
                    Повторная попытка ({statusAttempt} из {MAX_ATTEMPTS})
                  </div>
                )}
              </div>
            )}

            {isFailed && (
              <div className={cn(css.statusOverlay, css.errorOverlay)}>
                <Result
                  status="error"
                  icon={
                    <CloseCircleFilled
                      style={{ color: "#ff4d4f", fontSize: 64 }}
                    />
                  }
                  title={errorInfo.title}
                  subTitle={errorInfo.hint ?? null}
                  extra={
                    <Button
                      onClick={handleRetryLast}
                      disabled={allDisabled}
                      loading={isImprovementLoading || isAddlayerLoading}
                    >
                      Повторить
                    </Button>
                  }
                />
              </div>
            )}
          </div>

          <div className={css.bottomContainer}>
            <div className={css.promptSelectContainer}>
              <Select
                searchable
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
                options={sortedPrompts.map((p) => ({
                  label: p.title ?? "",
                  value: p.id ?? "",
                }))}
                optionRender={(option) => {
                  const id = String(option.value ?? "");
                  const isFav = favoriteIdSet.has(id);
                  return (
                    <div className={css.promptOption}>
                      <span className={css.promptOptionLabel}>
                        {String(option.label ?? "")}
                      </span>
                      {branchId && (
                        <span
                          className={cn(
                            css.promptStar,
                            isFav && css.promptStarActive
                          )}
                          onMouseDown={(e) => {
                            // preventDefault сохраняет фокус инпута (иначе дропдаун
                            // закроется), stopPropagation не даёт выбрать пункт.
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onClick={(e) => toggleFavorite(id, e)}
                        >
                          {isFav ? <StarFilled /> : <StarOutlined />}
                        </span>
                      )}
                    </div>
                  );
                }}
                disabled={allDisabled}
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
                    disabled={allDisabled}
                  />
                </div>
              )}
            </div>
            {selectedPromptId && selectedHistoryItem?.description && (
              <div className={css.promptDescriptionBlock}>
                <div className={css.promptDescriptionTitle}>Описание</div>
                <div className={css.promptDescriptionText}>
                  {selectedHistoryItem.description}
                </div>
              </div>
            )}
            <div className={css.resolutionGroup}>
              <span className={css.resolutionLabel}>Разрешение:</span>
              <Radio.Group
                value={outputResolution}
                onChange={(e) =>
                  setOutputResolution(
                    e.target.value as PostPhotosAddlayerBodyOutputResolution,
                  )
                }
                disabled={allDisabled}
              >
                <Radio value="2K">2K (быстро)</Radio>
                <Radio value="4K">4K (высокое качество)</Radio>
              </Radio.Group>
            </div>
            <div className={css.bottomContainerInner}>
              {hasImprovedVersion && (
                <Button
                  onClick={handleRevertPhoto}
                  disabled={allDisabled}
                  loading={isRevertLoading}
                >
                  Вернуть к оригиналу
                </Button>
              )}
              <Button
                onClick={handleImprovePhoto}
                disabled={
                  allDisabled || !selectedPromptId || bodyForRequest == null
                }
                loading={
                  isProcessing ||
                  isImprovementLoading ||
                  isAddlayerLoading ||
                  isPhotoLoading
                }
              >
                {getMainButtonLabel()}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default ImprovementModal;
