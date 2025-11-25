import React, { FC, useEffect, useMemo, useState } from "react";
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
import cn from "classnames";

type Props = {
  photoId: string;
  isOpen: boolean;
  onOk: () => void;
  onCancel: () => void;
};

const ImprovementModal: FC<Props> = ({ photoId, isOpen, onOk, onCancel }) => {
  const [promptIds, setPromptIds] = useState<string[]>([]);
  const [runPooling, setRunPooling] = useState(false);

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

  useEffect(() => {
    if (!runPooling) return;

    const interval = setInterval(() => {
      const improvedPhotoUrl = photoData?.data.current.original;

      if (!improvedPhotoUrl) {
        refetchPhoto();
      } else {
        refetchPhoto();
        clearInterval(interval);
        setRunPooling(false);
        showNotification({
          message: "Фото улучшено",
          type: "success",
        });
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [photoData, runPooling]);

  const handleImprovePhoto = () => {
    improvePhoto({
      data: {
        photoIds: [photoId],
        promptId: promptIds[0],
      },
    })
      .then(() => {
        setRunPooling(true);
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
          <div className={css.improvePhotoImgContainer}>
            <img
              src={improvedPhoto ?? originalPhoto}
              className={cn(css.imgInModal, runPooling && css.filter)}
            />

            {runPooling && (
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
                  runPooling ||
                  isPhotoLoading
                }
                loading={isPromptsLoading}
                options={options}
                mode="multiple"
                size="large"
              />

              <Button
                onClick={handleImprovePhoto}
                disabled={
                  !promptIds.length ||
                  isPromptsLoading ||
                  runPooling ||
                  isPhotoLoading
                }
                loading={runPooling || isImprovementLoading || isPhotoLoading}
              >
                {runPooling ? "Идёт улучшение фото" : "Улучшить фото"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default ImprovementModal;
