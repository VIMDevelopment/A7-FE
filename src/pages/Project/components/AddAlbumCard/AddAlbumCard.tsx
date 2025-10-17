import React, { FC, useEffect, useState } from "react";
import css from "./index.module.css";
import Modal from "../../../../components/Modal/Modal";
import Input from "../../../../components/Input/Input";
import {
  usePostAlbums,
  usePostProjectsCreate,
} from "../../../../apiV2/a7-service";
import { defaultApiAxiosParams } from "../../../../api/helpers";
import { showNotification } from "../../../../components/ShowNotification";
import { useQueryClient } from "react-query";
import { formatDate } from "../../../../lib/formatters/date";

type Props = {
  projectId: string;
  allAlbumsNames: string[];
};

const AddAlbumCard: FC<Props> = ({ projectId, allAlbumsNames }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState(`${formatDate(new Date())}`);

  const queryClient = useQueryClient();

  const {
    isLoading,
    isSuccess,
    mutate: createAlbum,
  } = usePostAlbums({
    axios: defaultApiAxiosParams,
  });

  useEffect(() => {
    if (isSuccess) {
      showNotification({
        message: "Альбом создан",
        type: "success",
      });
      setIsModalOpen(false);
      void queryClient.invalidateQueries({
        queryKey: `/albums/project/${projectId}`,
      });
      setInputValue(`${formatDate(new Date())}`)
    }
  }, [isSuccess]);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    const isNameUniq = !allAlbumsNames.some((item) => item.toLocaleLowerCase() === inputValue.toLocaleLowerCase());

    if (isNameUniq) {
      createAlbum({
        data: {
          title: inputValue,
          projectId,
          isPublic: true,
          description: "",
          tags: [],
        },
      });
    } else {
      showNotification({
        type: "error",
        message:
          "Альбом с таким названием уже существует. Пожалуйста, введите другое название.",
      });
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setInputValue(`${formatDate(new Date())}`)
  };

  return (
    <>
      <div
        className={css.container}
        onClick={showModal}
      >{`+\nДобавить\nальбом`}</div>

      <Modal
        title={"Добавление альбома"}
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

export default AddAlbumCard;
