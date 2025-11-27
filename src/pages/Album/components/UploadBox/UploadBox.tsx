import React, { FC, useEffect, useRef } from "react";
import { Spin, Upload } from "antd";
import { showNotification } from "../../../../components/ShowNotification";
import css from "./index.module.css";
import { usePostPhotosUpload } from "../../../../apiV2/a7-service";
import { beforeUpload as oldBeforeUpload, normalizeFile } from "./helpers";
import { ENV } from "../../../../env";
import { apiGetToken } from "../../../../auth/apiGetToken";
import { stringify } from "qs";
import { useQueryClient } from "react-query";
import cn from "classnames";
import { LoadingOutlined } from "@ant-design/icons";

const { Dragger } = Upload;

type Props = {
  size: "small" | "big";
  albumId: string;
  isAlbumLoading: boolean;
};

const UploadBox: FC<Props> = ({ size, albumId, isAlbumLoading }) => {
  const queryClient = useQueryClient();

  const {
    isSuccess,
    isLoading,
    mutateAsync: upload,
  } = usePostPhotosUpload({
    axios: {
      baseURL: ENV.REACT_APP_API_URL,
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: apiGetToken() ? `Bearer ${apiGetToken()}` : "",
      },
      paramsSerializer: (params: any) =>
        stringify(params, { arrayFormat: "repeat" }),
    },
  });

  const queue = useRef<File[]>([]);
  const uploadingRef = useRef(false);

  const processQueue = async () => {
    if (uploadingRef.current) return;
    if (queue.current.length === 0) return;

    uploadingRef.current = true;

    while (queue.current.length > 0) {
      const file = queue.current.shift()!;

      try {
        await upload({
          data: {
            photo: normalizeFile(file),
            albumId,
          },
        });
      } catch {
        showNotification({
          type: "error",
          message: `Ошибка загрузки файла ${file.name}`,
        });
      }
    }

    uploadingRef.current = false;

    void queryClient.invalidateQueries({
      queryKey: [`/photos/album/${albumId}`],
    });
  };

  useEffect(() => {
    if (isSuccess) {
      showNotification({
        type: "success",
        message: "Файлы загружены",
      });
      setTimeout(() => {
        void queryClient.invalidateQueries({
          queryKey: [`/photos/album/${albumId}`],
        });
      }, 200);
    }
  }, [isSuccess]);

  return (
    <div className={cn(size === "big" ? css.container : css.smallContainer)}>
      {isLoading || isAlbumLoading ? (
        <Spin
          size="large"
          indicator={<LoadingOutlined spin style={{ color: "white" }} />}
        />
      ) : (
        <Dragger
          className={cn(size === "big" ? css.dragger : css.smallDragger)}
          multiple={true}
          showUploadList={false}
          beforeUpload={(file) => {
            oldBeforeUpload(file);
            queue.current.push(file);
            processQueue();
            return false;
          }}
          accept="image/*"
        >
          {size === "big"
            ? `+\nАльбом пуст\nперетащите фотографии`
            : `+\nДобавить\nфото`}
        </Dragger>
      )}
    </div>
  );
};

export default UploadBox;
