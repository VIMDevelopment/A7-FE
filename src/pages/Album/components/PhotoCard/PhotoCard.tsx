import React, { FC, useState } from "react";
import css from "./index.module.css";
import { Dropdown, Image } from "antd";
import Checkbox from "antd/es/checkbox/Checkbox";
import { MoreOutlined } from "@ant-design/icons";
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
import { downloadImageByUrl, handlePrintPhoto } from "./helpers";

type Props = {
  id: string;
  url: string;
  name: string;
  isSelected: boolean;
  albumId: string;
  onSelect: (id: string) => void;
};

const PhotoCard: FC<Props> = ({
  id,
  url,
  name,
  isSelected,
  albumId,
  onSelect,
}) => {
  const queryClient = useQueryClient();

  const [inputPhotoNameValue, setInputPhotoNameValue] = useState(name);
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

  const items: ItemType[] = [
    {
      key: "0",
      label: "Печать",
      onClick: () => handlePrintPhoto(url, name),
    },
    {
      key: "1",
      label: "Скачать",
      onClick: () => downloadImageByUrl(url, name),
    },
    {
      key: "2",
      label: "Переименовать",
      onClick: () => setIsEditPhotoNameModalOpen(true),
    },
    {
      key: "3",
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
    <div className={css.container}>
      <div className={css.checkboxContainer}>
        <Checkbox
          className={css.checkbox}
          checked={isSelected}
          onClick={() => onSelect(id)}
        />
      </div>
      <div className={css.actionMenuIconContainer}>
        <div className={css.menuIconButton}>
          <Dropdown
            overlayClassName={css.dropdown}
            placement="bottomRight"
            menu={{ items, theme: "dark" }}
            trigger={["click"]}
          >
            <MoreOutlined
              style={{
                color: "white",
              }}
            />
          </Dropdown>
        </div>
      </div>
      <div className={css.imgContainer}>
        <Image src={url} className={css.img} />
      </div>
      <div className={css.name}>{name}</div>

      <Modal
        title={"Редактирование названия фото"}
        open={isEditPhotoNameModalOpen}
        onOk={handleEditPhotoNameOk}
        onCancel={handleEditPhotoNameCancel}
        okButtonName="Сохранить"
        destroyOnHidden
        isLoading={isEditPhotoNameLoading}
      >
        <Input
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
        {`Вы уверены, что хотите удалить фото ${name}? Данные будут безвозвратно
        утеряны.`}
      </Modal>
    </div>
  );
};

export default PhotoCard;
