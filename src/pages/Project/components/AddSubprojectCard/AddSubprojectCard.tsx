import React, { FC, useEffect, useState } from "react";
import css from "./index.module.css";
import Modal from "../../../../components/Modal/Modal";
import Input from "../../../../components/Input/Input";
import {
  getGetSubprojectsQueryKey,
  usePostSubprojects,
} from "../../../../apiV2/a7-service";
import { defaultApiAxiosParams } from "../../../../api/helpers";
import { showNotification } from "../../../../components/ShowNotification";
import { useQueryClient } from "react-query";
import { useParams } from "react-router-dom";
import { formatDate } from "../../../../lib/formatters/date";

type Props = {
  allSubprojectsNames: string[];
};

const AddSubprojectCard: FC<Props> = ({ allSubprojectsNames }) => {
  const { projectId } = useParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState(`${formatDate(new Date())}`);

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
      setIsModalOpen(false);
      void queryClient.invalidateQueries({
        queryKey: getGetSubprojectsQueryKey({ projectId: projectId ?? "" }),
      });
      setInputValue(`${formatDate(new Date())}`);
    }
  }, [isSuccess]);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    const isNameUniq = !allSubprojectsNames.some(
      (item) => item.toLocaleLowerCase().trim() === inputValue.toLocaleLowerCase().trim()
    );

    if (isNameUniq) {
      createSubroject({
        data: {
          projectId: projectId ?? "",
          name: inputValue,
        },
      });
    } else {
      showNotification({
        type: "error",
        message:
          "Папка с таким названием уже существует. Пожалуйста, введите другое название.",
      });
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setInputValue(`${formatDate(new Date())}`);
  };

  return (
    <>
      <div
        className={css.container}
        onClick={showModal}
      >{`+\nДобавить\nпапку`}</div>

      <Modal
        title={"Добавление папки"}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        okButtonName="Добавить"
        destroyOnHidden
        isLoading={isLoading}
      >
        <Input
          label="Введите название"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
      </Modal>
    </>
  );
};

export default AddSubprojectCard;
