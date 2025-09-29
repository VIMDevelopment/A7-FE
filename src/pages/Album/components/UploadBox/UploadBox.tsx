import React, { FC, useEffect } from "react";
import { Upload } from "antd";
import { showNotification } from "../../../../components/ShowNotification";
import css from "./index.module.css";
import {
  usePostPhotosUpload,
  usePutAlbumsCover,
} from "../../../../apiV2/a7-service";
import { beforeUpload, normalizeFile } from "./helpers";
import { ENV } from "../../../../env";
import { apiGetToken } from "../../../../auth/apiGetToken";
import { stringify } from "qs";
import { useQueryClient } from "react-query";
import cn from "classnames";
import { defaultApiAxiosParams } from "../../../../api/helpers";

const { Dragger } = Upload;

type Props = {
  size: "small" | "big";
  albumId: string;
};

const UploadBox: FC<Props> = ({ size, albumId }) => {
  const queryClient = useQueryClient();

  const {
    data,
    isSuccess,
    mutate: upload,
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

  const { mutate: setAlbumCover } = usePutAlbumsCover({
    axios: defaultApiAxiosParams,
  });

  useEffect(() => {
    if (isSuccess) {
      showNotification({
        type: "success",
        message: "Файлы успешно загружены",
      });
      void queryClient.invalidateQueries({
        queryKey: `/photos/album/${albumId}`,
      });

      if (size === "big") {
        setAlbumCover({
          data: {
            photoId: data?.data?.id ?? "",
            albumId: albumId,
          },
        });
      }
    }
  }, [isSuccess, data, size]);

  return (
    <div className={cn(size === "big" ? css.container : css.smallContainer)}>
      <Dragger
        className={cn(size === "big" ? css.dragger : css.smallDragger)}
        multiple={true}
        showUploadList={false}
        onChange={(info) => {
          const { status } = info.file;

          if (status === "done") {
            showNotification({
              type: "success",
              message: `Файл ${info.file.name} успешно загружен`,
            });
          } else if (status === "error") {
            showNotification({
              type: "error",
              message: `Ошибка загрузки файла ${info.file.name}`,
            });
          }
        }}
        beforeUpload={beforeUpload}
        accept="image/*"
        customRequest={(options) => {
          const safeFile = normalizeFile(options.file as File);

          upload({
            data: {
              photo: safeFile,
              albumId,
            },
          });
        }}
      >
        {size === "big"
          ? `+\nАльбом пуст\nперетащите фотографии`
          : `+\nДобавить\nфото`}
      </Dragger>
    </div>
  );
};

export default UploadBox;
