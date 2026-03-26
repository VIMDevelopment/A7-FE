import React, { useEffect, useRef, useState } from "react";
import { Button, Spin } from "antd";
import axios from "axios";
import {
  CheckOutlined,
  CloudSyncOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { usePostYandexdiskSyncProjectProjectId } from "../../apiV2/a7-service";
import { defaultApiAxiosParams } from "../../api/helpers";
import { showNotification } from "../ShowNotification";
import css from "./index.module.css";
import { useQueryClient } from "react-query";

type Props = {
  projectId: string;
  subprojectId?: string;
  albumId?: string;
};

const SUCCESS_DISPLAY_MS = 2200;

const YandexDiskProjectSyncControl: React.FC<Props> = ({
  projectId,
  subprojectId,
  albumId,
}) => {
  const [showSuccess, setShowSuccess] = useState(false);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryClient = useQueryClient();

  const { mutateAsync, isLoading, reset } = usePostYandexdiskSyncProjectProjectId(
    {
      axios: defaultApiAxiosParams,
    }
  );

  useEffect(() => {
    return () => {
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }
    };
  }, []);

  if (!projectId) {
    return null;
  }

  const handleClick = async () => {
    try {
      const response = await mutateAsync({ projectId });
      if((response.data.errors ?? []).length > 0) {
        response.data.errors?.forEach(item => {
          showNotification({
            type: "error",
            message: item,
          })
        })
      }
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [`/projects/project/${projectId}`],
        }),
        queryClient.invalidateQueries({
          queryKey: ["/subprojects"],
        }),
        ...(subprojectId
          ? [
              queryClient.invalidateQueries({
                queryKey: [`/subprojects/${subprojectId}`],
              }),
              queryClient.invalidateQueries({
                queryKey: [`/albums/subproject/${subprojectId}`],
              }),
            ]
          : []),
        ...(albumId
          ? [
              queryClient.invalidateQueries({
                queryKey: [`/albums/${albumId}`],
              }),
            ]
          : []),
      ]);
      reset();
      setShowSuccess(true);
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }
      successTimerRef.current = setTimeout(() => {
        setShowSuccess(false);
        successTimerRef.current = null;
      }, SUCCESS_DISPLAY_MS);
    } catch (e) {
      reset();
      let description: string | undefined;
      if (axios.isAxiosError(e) && e.response?.data) {
        const data = e.response.data as unknown;
        if (typeof data === "string") {
          description = data;
        } else if (data && typeof data === "object" && "message" in data) {
          description = String((data as { message: unknown }).message);
        }
      }
      showNotification({
        type: "error",
        message: "Не удалось синхронизировать с Яндекс.Диском",
        description,
      });
    }
  };

  return (
    <div className={css.root}>
      <Button
        type="text"
        className={css.button}
        disabled={isLoading}
        onClick={() => void handleClick()}
        aria-label="Синхронизировать с Яндекс.Диском"
      >
        {isLoading ? (
          <Spin
            size="default"
            indicator={
              <LoadingOutlined
                className={css.spinIcon}
                spin
              />
            }
          />
        ) : showSuccess ? (
          <CheckOutlined className={css.iconSuccess} />
        ) : (
          <CloudSyncOutlined className={css.iconIdle} />
        )}
      </Button>
    </div>
  );
};

export default YandexDiskProjectSyncControl;
