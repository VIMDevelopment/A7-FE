import React, { FC } from "react";
import css from "./index.module.css";
import { usePostAlbums } from "../../../../apiV2/a7-service";
import { defaultApiAxiosParams } from "../../../../api/helpers";
import { showNotification } from "../../../../components/ShowNotification";
import { useQueryClient } from "react-query";
import { useParams } from "react-router-dom";
import { Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";

const AddAlbumCard: FC = () => {
  const { subprojectId } = useParams();

  const queryClient = useQueryClient();

  const { isLoading, mutateAsync: createAlbum } = usePostAlbums({
    axios: defaultApiAxiosParams,
  });

  const handleOk = () => {
    createAlbum({
      data: {
        subprojectId: subprojectId ?? "",
      },
    }).then(() => {
      showNotification({
        message: "Альбом создан",
        type: "success",
      });
      void queryClient.invalidateQueries({
        queryKey: `/albums/subproject/${subprojectId}`,
      });
    });
  }

  return (
    <>
      <div
        className={css.container}
        onClick={handleOk}
      >
        {isLoading ? <Spin size="large" indicator={<LoadingOutlined spin style={{ color: "white", fontSize: "60px" }} />} /> : `+\nДобавить\nальбом`}
      </div>
    </>
  );
};

export default AddAlbumCard;
