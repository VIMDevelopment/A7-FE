import React, { FC, useEffect, useRef, useState } from "react";
import { Progress, Spin, Upload, UploadFile, UploadProps } from "antd";
import { showNotification } from "../../../../components/ShowNotification";
import css from "./index.module.css";
import { usePostPhotosUpload } from "../../../../apiV2/a7-service";
import { beforeUpload as oldBeforeUpload, normalizeFile } from "./helpers";
import {
  uploadWithRetry,
  uploadFailureToast,
  UPLOAD_TIMEOUT_MS,
} from "./uploadRetry";
import { resizeImageBeforeUpload } from "../../../../utils/imageResize/resizeImageBeforeUpload";
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
    // R-34: у аплоада свои повторы и свой финальный тост — глобальный onError
    // (react-query defaultOptions) глушим, иначе он стрелял бы на каждую попытку.
    mutation: { onError: () => undefined },
    axios: {
      baseURL: ENV.REACT_APP_API_URL,
      // R-34: без таймаута запрос по рваному каналу висел вечно.
      timeout: UPLOAD_TIMEOUT_MS,
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
      }, 1000);
    }
  }, [isUploading]);

  const queue = useRef<File[]>([]);
  const uploadingRef = useRef(false);

  const processQueue = async () => {
    if (uploadingRef.current) return;
    if (queue.current.length === 0) return;

    uploadingRef.current = true;

    while (queue.current.length > 0) {
      const original = queue.current.shift()!;
      const resized = await resizeImageBeforeUpload(original);
      const file = resized ?? original;

      // R-34: обрыв сети/5xx — до 3 попыток с паузой; 4xx — сразу честный тост.
      const result = await uploadWithRetry(() =>
        upload({
          data: {
            photo: normalizeFile(file),
            albumId,
          },
        })
      );

      if (!result.ok) {
        const toast = uploadFailureToast(original.name, result.failure);
        showNotification({
          type: "error",
          message: toast.message,
          description: toast.description,
          duration: 30,
        });
      }

      setUploadDone((prev) => prev + 1);
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
