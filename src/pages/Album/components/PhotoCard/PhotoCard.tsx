import React, { FC, useState } from "react";
import css from "./index.module.css";
import { Dropdown, Image } from "antd";
import Checkbox from "antd/es/checkbox/Checkbox";
import { MoreOutlined } from "@ant-design/icons";
import { ItemType } from "antd/es/menu/interface";
import Modal from "../../../../components/Modal/Modal";
import { useQueryClient } from "react-query";
import { useDeletePhotosId } from "../../../../apiV2/a7-service";
import { defaultApiAxiosParams } from "../../../../api/helpers";
import { showNotification } from "../../../../components/ShowNotification";

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

  const [isDeletePhotoModalOpen, setIsDeletePhotoModalOpen] = useState(false);

  const { isLoading: isDeletePhotoLoading, mutateAsync: deletePhoto } =
    useDeletePhotosId({
      axios: defaultApiAxiosParams,
    });

  const handleDeletePhotoOk = () => {
    deletePhoto({ id })
      .then(() => {
        showNotification({
          message: "Фото успешно удалено",
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
      label: "Переименовать",
    },
    {
      key: "1",
      label: "Удалить",
      danger: true,
      onClick: () => setIsDeletePhotoModalOpen(true),
    },
  ];

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
