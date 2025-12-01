import React, { FC, useState } from "react";
import css from "./index.module.css";
import Modal from "../../../../components/Modal/Modal";
import Input from "../../../../components/Input/Input";
import { usePostProjectsCreate } from "../../../../apiV2/a7-service";
import { defaultApiAxiosParams } from "../../../../api/helpers";
import { showNotification } from "../../../../components/ShowNotification";
import { useQueryClient } from "react-query";

type Props = {
  allProjectsNames: string[];
};

const AddProjectCard: FC<Props> = ({ allProjectsNames }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const queryClient = useQueryClient();

  const { isLoading, mutateAsync: createProject } = usePostProjectsCreate({
    axios: defaultApiAxiosParams,
  });

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    const isNameUniq = !allProjectsNames.some(
      (item) => item.toLocaleLowerCase().trim() === inputValue.toLocaleLowerCase().trim()
    );

    if (isNameUniq) {
      createProject({
        data: {
          name: inputValue,
        },
      }).then(() => {
        showNotification({
          message: "Филиал создан",
          type: "success",
        });
        setIsModalOpen(false);
        void queryClient.invalidateQueries({ queryKey: "/projects" });
        setInputValue("");
      });
    } else {
      showNotification({
        type: "error",
        message:
          "Филиал с таким названием уже существует. Пожалуйста, введите другое название.",
      });
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setInputValue("");
  };

  return (
    <>
      <div
        className={css.container}
        onClick={showModal}
      >{`+\nДобавить\nфилиал`}</div>

      <Modal
        title={"Добавление филиала"}
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

export default AddProjectCard;
