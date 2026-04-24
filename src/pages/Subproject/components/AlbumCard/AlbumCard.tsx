import React, { FC, useState, useMemo } from "react";
import css from "./index.module.css";
import { useNavigate, useParams } from "react-router-dom";
import { PublicRoutes } from "../../../../routes/routes";
import {
  useDeleteAlbumsId,
  useGetPhotosId,
  useGetPhotosAlbumAlbumId,
} from "../../../../apiV2/a7-service";
import { defaultApiAxiosParams } from "../../../../api/helpers";
import { Dropdown } from "antd";
import { MoreOutlined } from "@ant-design/icons";
import { ItemType } from "antd/es/menu/interface";
import Modal from "../../../../components/Modal/Modal";
import { showNotification } from "../../../../components/ShowNotification";
import { useQueryClient } from "react-query";
import { useMediaQuery } from "react-responsive";
import cn from "classnames";
import { getPhotoVersion } from "../../../Album/components/PhotoCard/helpers";

type Props = {
  id?: string;
  name?: string;
  coverId?: string;
  isProcessed?: boolean; 
};

const AlbumCard: FC<Props> = ({ id, name, coverId, isProcessed }) => {
  const { projectId, subprojectId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isMobile = useMediaQuery({ maxWidth: 768 });

  const [isDeleteAlbumModalOpen, setIsDeleteAlbumModalOpen] = useState(false);

  const { data, isError, isLoading } = useGetPhotosId(coverId ?? "", {
    axios: defaultApiAxiosParams,
    query: {
      onError: () => null,
    },
  });

  const { isLoading: isDeleteAlbumLoading, mutateAsync: deleteAlbum } =
    useDeleteAlbumsId({
      axios: defaultApiAxiosParams,
    });

  const { data: albumPhotosData } = useGetPhotosAlbumAlbumId(id ?? "", {
    axios: defaultApiAxiosParams,
    query: {
      enabled: !!id,
    },
  });

  const allPhotosImproved = useMemo(() => {
    const photos = albumPhotosData?.data ?? [];
    if (photos.length === 0) return true;
    return photos.every((photo) => !!photo.current?.original);
  }, [albumPhotosData]);

  const handleAlbumClick = () => {
    navigate(
      PublicRoutes.ALBUM.get({
        projectId: projectId ?? "",
        subprojectId: subprojectId ?? "",
        albumId: id ?? "",
      })
    );
  };

  const handleDeleteAlbumCancel = () => {
    setIsDeleteAlbumModalOpen(false);
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
    });
  };

  const items: ItemType[] = [
    {
      key: "1",
      label: "Удалить",
      danger: true,
      onClick: () => setIsDeleteAlbumModalOpen(true),
    },
  ];

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
                fontSize: isMobile ? "30px" : "unset",
              }}
            />
          </Dropdown>
        </div>
      </div>
      <div
        className={cn(
          css.container,
          !allPhotosImproved && !isProcessed && css.orange
        )}
        onClick={handleAlbumClick}
      >
        {coverId && !isError && !isLoading && data?.data ? (
          <div className={css.imgContainer}>
            <img
              className={css.img}
              src={getPhotoVersion(data.data).small}
              alt=""
            />
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
