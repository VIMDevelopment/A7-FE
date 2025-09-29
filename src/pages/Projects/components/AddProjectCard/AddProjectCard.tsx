import React, { useEffect, useState } from "react";
import css from "./index.module.css";
import Modal from "../../../../components/Modal/Modal";
import Input from "../../../../components/Input/Input";
import { usePostProjectsCreate } from "../../../../apiV2/a7-service";
import { defaultApiAxiosParams } from "../../../../api/helpers";
import { showNotification } from "../../../../components/ShowNotification";
import { useQueryClient } from "react-query";

const AddProjectCard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const queryClient = useQueryClient();

  const {
    isLoading,
    isSuccess,
    mutate: createProject,
  } = usePostProjectsCreate({
    axios: defaultApiAxiosParams,
  });

  useEffect(() => {
    if (isSuccess) {
      showNotification({
        message: "Проект успешно создан",
        type: "success",
      });
      setIsModalOpen(false);
      void queryClient.invalidateQueries({ queryKey: "/projects" });
    }
  }, [isSuccess]);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    createProject({
      data: {
        name: inputValue,
      },
    });
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <div
        className={css.container}
        onClick={showModal}
      >{`+\nДобавить\nпроект`}</div>

      <Modal
        title={"Добавление проекта"}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        okButtonName="Добавить"
        destroyOnHidden
        isLoading={isLoading}
      >
        <Input
          className={css.input}
          label="Введите название"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
      </Modal>
    </>
  );
};

export default AddProjectCard;
