import React, { FC, useState } from "react";
import css from "./index.module.css";
import { useNavigate, useParams } from "react-router-dom";
import { PublicRoutes } from "../../../../routes/routes";
import {
  useDeleteAlbumsId,
  useGetAlbumsSubprojectSubprojectId,
  useGetPhotosId,
  usePutAlbumsId,
} from "../../../../apiV2/a7-service";
import { defaultApiAxiosParams } from "../../../../api/helpers";
import { Dropdown } from "antd";
import { MoreOutlined } from "@ant-design/icons";
import { ItemType } from "antd/es/menu/interface";
import Modal from "../../../../components/Modal/Modal";
import Input from "../../../../components/Input/Input";
import { showNotification } from "../../../../components/ShowNotification";
import { useQueryClient } from "react-query";
import { useMediaQuery } from "react-responsive";

type Props = {
  id?: string;
  name?: string;
  coverId?: string;
};

const AlbumCard: FC<Props> = ({ id, name, coverId }) => {
  const { projectId, subprojectId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isMobile = useMediaQuery({ maxWidth: 768 });

  const [isEditAlbumModalOpen, setIsEditAlbumModalOpen] = useState(false);
  const [isDeleteAlbumModalOpen, setIsDeleteAlbumModalOpen] = useState(false);
  const [inputAlbumValue, setInputAlbumValue] = useState(name ?? "");

  const { data, isError, isLoading } = useGetPhotosId(coverId ?? "", {
    axios: defaultApiAxiosParams,
    query: {
      onError: () => null,
    },
  });

  const { isLoading: isEditAlbumLoading, mutateAsync: updateAlbum } =
    usePutAlbumsId({
      axios: defaultApiAxiosParams,
    });

  const { isLoading: isDeleteAlbumLoading, mutateAsync: deleteAlbum } =
    useDeleteAlbumsId({
      axios: defaultApiAxiosParams,
    });

  const { data: albumsData } = useGetAlbumsSubprojectSubprojectId(
    subprojectId ?? "",
    {
      axios: defaultApiAxiosParams,
    }
  );

  const allAlbumsNames = albumsData?.data.map((item) => item.title ?? "") ?? [];

  const handleAlbumClick = () => {
    navigate(
      PublicRoutes.ALBUM.get({
        projectId: projectId ?? "",
        subprojectId: subprojectId ?? "",
        albumId: id ?? "",
      })
    );
  };

  const handleEditAlbumOk = () => {
    const isNameUniq = !allAlbumsNames.some(
      (item) =>
        item.toLocaleLowerCase().trim() ===
        inputAlbumValue.toLocaleLowerCase().trim()
    );

    if (isNameUniq) {
      updateAlbum({
        id: id ?? "",
        data: {
          title: inputAlbumValue,
        },
      }).then(() => {
        showNotification({
          message: "Альбом переименован",
          type: "success",
        });
        setIsEditAlbumModalOpen(false);
        void queryClient.invalidateQueries({
          queryKey: `/albums/subproject/${subprojectId}`,
        });
      });
    } else {
      showNotification({
        type: "error",
        message:
          "Альбом с таким названием уже существует. Пожалуйста, введите другое название.",
      });
    }
  };

  const handleDeleteAlbumOk = () => {
    deleteAlbum({
      id: id ?? "",
    }).then(() => {
      showNotification({
        message: "Альбом удален",
        type: "success",
      });
      setIsDeleteAlbumModalOpen(false);
      void queryClient.invalidateQueries({
        queryKey: `/albums/subproject/${subprojectId}`,
      });
      navigate(
        PublicRoutes.SUBPROJECT.get({
          projectId: projectId ?? "",
          subprojectId: subprojectId ?? "",
        })
      );
    });
  };

  const items: ItemType[] = [
    {
      key: "1",
      label: "Переименовать",
      onClick: () => setIsEditAlbumModalOpen(true),
    },
    {
      key: "2",
      label: "Удалить",
      danger: true,
      onClick: () => setIsDeleteAlbumModalOpen(true),
    },
  ];

  const handleEditAlbumCancel = () => {
    setIsEditAlbumModalOpen(false);
    setInputAlbumValue(name ?? "");
  };

  const handleDeleteAlbumCancel = () => {
    setIsDeleteAlbumModalOpen(false);
  };

  return (
    <div>
      <div className={css.actionMenuIconContainer}>
        <div className={css.menuIconButton}>
          <Dropdown
            overlayClassName={css.dropdown}
            placement="bottomRight"
            menu={{ items }}
            trigger={["click"]}
          >
            <MoreOutlined
              style={{
                color: "white",
                fontSize: isMobile ? "30px" : "unset",
              }}
            />
          </Dropdown>
        </div>
      </div>
      <div className={css.container} onClick={handleAlbumClick}>
        {coverId && !isError && !isLoading ? (
          <div className={css.imgContainer}>
            <img className={css.img} src={data?.data.default.original} alt="" />
          </div>
        ) : (
          <div className={css.albumPreviewContainer}>
            <div className={css.previewMock}></div>
            <div className={css.previewMock}></div>
            <div className={css.previewMock}></div>
            <div className={css.previewMock}></div>
          </div>
        )}
        {name ?? "Безымянный"}
      </div>
      <Modal
        title={"Редактирование альбома"}
        open={isEditAlbumModalOpen}
        onOk={handleEditAlbumOk}
        onCancel={handleEditAlbumCancel}
        okButtonName="Сохранить"
        destroyOnHidden
        isLoading={isEditAlbumLoading}
      >
        <Input
          label="Введите название"
          value={inputAlbumValue}
          onChange={(e) => setInputAlbumValue(e.target.value)}
        />
      </Modal>

      <Modal
        title={"Удаление альбома"}
        open={isDeleteAlbumModalOpen}
        onOk={handleDeleteAlbumOk}
        onCancel={handleDeleteAlbumCancel}
        okButtonName="Удалить"
        destroyOnHidden
        isLoading={isDeleteAlbumLoading}
        customOkButtonClassName={css.deleteButton}
      >
        {`Вы уверены, что хотите удалить альбом "${name}"? Все данные будут безвозвратно
        утеряны.`}
      </Modal>
    </div>
  );
};

export default AlbumCard;
