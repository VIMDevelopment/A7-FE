import React, { FC, useRef, useState } from "react";
import css from "./index.module.css";
import { Dropdown, Image, InputRef, Spin } from "antd";
import Checkbox from "antd/es/checkbox/Checkbox";
import {
  LoadingOutlined,
  MoreOutlined,
  RocketOutlined,
} from "@ant-design/icons";
import { ItemType } from "antd/es/menu/interface";
import Modal from "../../../../components/Modal/Modal";
import { useQueryClient } from "react-query";
import {
  useDeletePhotosId,
  usePutPhotosId,
} from "../../../../apiV2/a7-service";
import { defaultApiAxiosParams } from "../../../../api/helpers";
import { showNotification } from "../../../../components/ShowNotification";
import Input from "../../../../components/Input/Input";
import { downloadImageByUrl, handlePrintPhoto, makeFileName } from "./helpers";
import { useMediaQuery } from "react-responsive";
import ImprovementModal from "../../../../components/ImprovementModal/ImprovementModal";
import cn from "classnames";
import type { PhotoStatus } from "../../../../apiV2/a7-service/model/photoStatus";

type Props = {
  id: string;
  isOriginal: boolean;
  hasImprovedVersion: boolean;
  url: string;
  smallUrl: string;
  previewUrl: string;
  name: string;
  isSelected: boolean;
  albumId: string;
  status?: PhotoStatus;
  /**
   * R-44: ключ карточки в выборе. В альбоме это ключ плитки — у модифицированного фото две
   * карточки (модификат + оригинал), по id их не различить. По умолчанию — id фото.
   */
  selectionKey?: string;
  /** R-44: готовое имя файла для печати/скачивания (у плитки-оригинала — исходник). */
  downloadFileName?: string;
  /** R-44: «Переименовать» в меню (у плитки-оригинала — нет: имя одно на запись). */
  canRename?: boolean;
  onSelect: (key: string) => void;
  onDelete?: (id: string) => void;
};

const PhotoCard: FC<Props> = ({
  id,
  isOriginal,
  hasImprovedVersion,
  url,
  smallUrl,
  previewUrl,
  name,
  isSelected,
  albumId,
  status,
  selectionKey,
  downloadFileName,
  canRename = true,
  onSelect,
  onDelete,
}) => {
  const queryClient = useQueryClient();
  const inputRef = useRef<InputRef>(null);
  const isMobile = useMediaQuery({ maxWidth: 768 });

  const [inputPhotoNameValue, setInputPhotoNameValue] = useState(name);
  const [isImprovePhotoModalOpen, setIsImprovePhotoModalOpen] = useState(false);
  const [isEditPhotoNameModalOpen, setIsEditPhotoNameModalOpen] =
    useState(false);
  const [isDeletePhotoModalOpen, setIsDeletePhotoModalOpen] = useState(false);

  const { isLoading: isDeletePhotoLoading, mutateAsync: deletePhoto } =
    useDeletePhotosId({
      axios: defaultApiAxiosParams,
    });

  const { isLoading: isEditPhotoNameLoading, mutateAsync: updatePhotoName } =
    usePutPhotosId({
      axios: defaultApiAxiosParams,
    });

  const handleAfterOpen = () => {
    const inputEl = inputRef.current?.input;

    if (inputEl) {
      inputEl.focus();
      const lastDotIndex = inputEl.value.lastIndexOf(".");
      inputEl.setSelectionRange(lastDotIndex, lastDotIndex);
    }
  };

  const handleDeletePhotoOk = () => {
    deletePhoto({ id })
      .then(() => {
        showNotification({
          message: "Фото удалено",
          type: "success",
        });

        setIsDeletePhotoModalOpen(false);

        void queryClient.invalidateQueries({
          queryKey: [`/photos/album/${albumId}`],
        });

        onDelete?.(id);
      })
      .catch(() => {
        showNotification({
          message: "Произошла ошибка при удалении фото",
          type: "error",
        });
      });
  };

  const handleDeletePhotoCancel = () => {
    setIsDeletePhotoModalOpen(false);
  };

  const handleImprovePhotoCancel = () => {
    setIsImprovePhotoModalOpen(false);
  };

  const fileNameToSave = downloadFileName ?? makeFileName({ fileName: name, isOriginal });

  const items: ItemType[] = [
    {
      key: "0",
      label: hasImprovedVersion ? "Обработать заново" : "Улучшить",
      onClick: () => setIsImprovePhotoModalOpen(true),
    },
    {
      key: "1",
      label: "Печать",
      onClick: () => handlePrintPhoto(url, fileNameToSave),
    },
    {
      key: "2",
      label: "Скачать",
      onClick: () => downloadImageByUrl(url, fileNameToSave),
    },
    ...(canRename
      ? [
          {
            key: "3",
            label: "Переименовать",
            onClick: () => setIsEditPhotoNameModalOpen(true),
          },
        ]
      : []),
    {
      key: "4",
      label: "Удалить",
      danger: true,
      onClick: () => setIsDeletePhotoModalOpen(true),
    },
  ];

  const handleEditPhotoNameOk = () => {
    updatePhotoName({
      id,
      data: {
        fileName: inputPhotoNameValue,
      },
    }).then(() => {
      showNotification({
        message: "Файл переименован",
        type: "success",
      });
      setIsEditPhotoNameModalOpen(false);
      void queryClient.invalidateQueries({
        queryKey: [`/photos/album/${albumId}`],
      });
    });
  };

  const handleEditPhotoNameCancel = () => {
    setIsEditPhotoNameModalOpen(false);
    setInputPhotoNameValue(name);
  };

  return (
    <div>
      <div className={css.actionMenuIconContainer}>
        <div className={css.checkboxContainer}>
          <Checkbox
            className={css.checkbox}
            checked={isSelected}
            onClick={() => onSelect(selectionKey ?? id)}
          />
        </div>
        <div className={css.rocketWrapper}>
          <div
            className={css.fastImproveButton}
            onClick={() => setIsImprovePhotoModalOpen(true)}
          >
            <RocketOutlined
              style={{
                fontSize: isMobile ? "30px" : "unset",
              }}
            />
          </div>
        </div>
        <div className={css.menuIconButton}>
          <Dropdown
            overlayClassName={css.dropdown}
            placement="bottomRight"
            menu={{ items }}
            trigger={["click"]}
          >
            <MoreOutlined
              style={{
                fontSize: isMobile ? "30px" : "unset",
              }}
            />
          </Dropdown>
        </div>
      </div>
      <div className={css.container}>
        <div
          className={cn(css.imgContainer, !hasImprovedVersion && css.orange)}
        >
          <Image
            src={smallUrl}
            className={cn(css.img, status === "processing" && css.dimmed)}
            preview={{
              src: previewUrl,
            }}
          />
          {status === "processing" && (
            <div className={css.processingOverlay}>
              <Spin
                indicator={
                  <LoadingOutlined
                    spin
                    style={{ color: "white", fontSize: 40 }}
                  />
                }
              />
            </div>
          )}
        </div>
        <div className={css.name}>{name}</div>

        <ImprovementModal
          photoId={id}
          isOpen={isImprovePhotoModalOpen}
          hasImprovedVersion={hasImprovedVersion}
          onCancel={handleImprovePhotoCancel}
          onOk={handleImprovePhotoCancel}
        />

        <Modal
          title={"Редактирование названия фото"}
          open={isEditPhotoNameModalOpen}
          onOk={handleEditPhotoNameOk}
          onCancel={handleEditPhotoNameCancel}
          okButtonName="Сохранить"
          destroyOnHidden
          isLoading={isEditPhotoNameLoading}
          afterOpenChange={handleAfterOpen}
        >
          <Input
            ref={inputRef}
            label="Введите название"
            value={inputPhotoNameValue}
            onChange={(e) => setInputPhotoNameValue(e.target.value)}
          />
        </Modal>

        <Modal
          title={"Удаление фото"}
          open={isDeletePhotoModalOpen}
          onOk={handleDeletePhotoOk}
          onCancel={handleDeletePhotoCancel}
          okButtonName="Удалить"
          destroyOnHidden
          isLoading={isDeletePhotoLoading}
          customOkButtonClassName={css.deleteButton}
        >
          <div className={css.modalContent}>
            <div>{`Вы уверены, что хотите удалить фото ${name}? Данные будут безвозвратно утеряны.`}</div>
            {hasImprovedVersion && (
              <div
                className={css.warningInfo}
              >{`Внимание! Удаляется всё фото целиком — и модифицированная версия, и оригинал (в альбоме пропадут обе карточки).`}</div>
            )}
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default PhotoCard;
