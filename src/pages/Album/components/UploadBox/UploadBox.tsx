import React, { FC, useEffect, useRef, useState } from "react";
import { Progress, Spin, Upload, UploadFile, UploadProps } from "antd";
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
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploadDone, setUploadDone] = useState(0);
  const [isUploadingGap, setIsUploadingGap] = useState(false);

  const progress =
    fileList.length > 0 ? Math.round((100 / fileList.length) * uploadDone) : 0;

  const handleChange: UploadProps["onChange"] = (info) => {
    setFileList(info.fileList);
  };

  const queryClient = useQueryClient();

  const {
    isSuccess,
    isLoading: isUploading,
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

  useEffect(() => {
    if (isUploading) {
      setIsUploadingGap(true);
    } else {
      setTimeout(() => {
        setIsUploadingGap(false);
        setUploadDone(0);
      }, 2000);
    }
  }, [isUploading]);

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

        setUploadDone((prev) => prev + 1);
      } catch {
        showNotification({
          type: "error",
          message: `Ошибка загрузки файла ${file.name}`,
          duration: 30,
        });

        setUploadDone((prev) => prev + 1);
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
      <Dragger
        className={cn(size === "big" ? css.dragger : css.smallDragger)}
        multiple={true}
        showUploadList={false}
        disabled={isUploading || isAlbumLoading}
        onChange={handleChange}
        beforeUpload={(file) => {
          oldBeforeUpload(file);
          queue.current.push(file);
          processQueue();
          return false;
        }}
        accept=".png, .jpg, .jpeg"
      >
        {isAlbumLoading ? (
          <Spin
            size="large"
            indicator={<LoadingOutlined spin style={{ color: "white" }} />}
          />
        ) : isUploadingGap ? (
          <Progress
            className={css.progress}
            strokeColor={"#b4b4b4"}
            type="circle"
            percent={progress}
          />
        ) : (
          <>
            {size === "big"
              ? `+\nАльбом пуст\nперетащите фотографии`
              : `+\nДобавить\nфото`}
          </>
        )}
      </Dragger>
    </div>
  );
};

export default UploadBox;
