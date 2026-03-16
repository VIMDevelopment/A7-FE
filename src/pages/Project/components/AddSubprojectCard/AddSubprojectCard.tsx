import React, { FC, useEffect, useState } from "react";
import css from "./index.module.css";
import {
  getGetSubprojectsQueryKey,
  usePostSubprojects,
} from "../../../../apiV2/a7-service";
import { defaultApiAxiosParams } from "../../../../api/helpers";
import { showNotification } from "../../../../components/ShowNotification";
import { useQueryClient } from "react-query";
import { useParams } from "react-router-dom";
import { formatDate } from "../../../../lib/formatters/date";
import { Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";

type Props = {
  allSubprojectsNames: string[];
};

const AddSubprojectCard: FC<Props> = ({ allSubprojectsNames }) => {
  const { projectId } = useParams();

  const queryClient = useQueryClient();

  const {
    isLoading,
    isSuccess,
    mutate: createSubroject,
  } = usePostSubprojects({
    axios: defaultApiAxiosParams,
  });

  useEffect(() => {
    if (isSuccess) {
      showNotification({
        message: "Папка создана",
        type: "success",
      });
      void queryClient.invalidateQueries({
        queryKey: getGetSubprojectsQueryKey({ projectId: projectId ?? "" }),
      });
    }
  }, [isSuccess]);

  const handleOk = () => {
    const today = `${formatDate(new Date())}`

    const isNameUniq = !allSubprojectsNames.some(
      (item) => item.toLocaleLowerCase().trim() === today.toLocaleLowerCase().trim()
    );

    if (isNameUniq) {
      createSubroject({
        data: {
          projectId: projectId ?? "",
          name: today,
        },
      });
    } else {
      showNotification({
        type: "error",
        message:
          "Папка на сегодняшний день уже создана.",
      });
    }
  };

  return (
    <>
      <div
        className={css.container}
        onClick={handleOk}
      >{isLoading ? <Spin size="large" indicator={<LoadingOutlined spin style={{ color: "white", fontSize: "60px" }} />} /> : `+\nДобавить\nпапку`}</div>
    </>
  );
};

export default AddSubprojectCard;
