import React, { FC, useState } from "react";
import css from "./index.module.css";
import Modal from "../../../../components/Modal/Modal";
import Input from "../../../../components/Input/Input";
import { usePostAlbums } from "../../../../apiV2/a7-service";
import { defaultApiAxiosParams } from "../../../../api/helpers";
import { showNotification } from "../../../../components/ShowNotification";
import { useQueryClient } from "react-query";
import { formatDateWithMinutes } from "../../../../lib/formatters/date";
import { useParams } from "react-router-dom";

type Props = {
  allAlbumsNames: string[];
};

const AddAlbumCard: FC<Props> = ({ allAlbumsNames }) => {
  const { subprojectId } = useParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState(
    `${formatDateWithMinutes(new Date())}`
  );

  const queryClient = useQueryClient();

  const { isLoading, mutateAsync: createAlbum } = usePostAlbums({
    axios: defaultApiAxiosParams,
  });

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    const isNameUniq = !allAlbumsNames.some(
      (item) => item.toLocaleLowerCase().trim() === inputValue.toLocaleLowerCase().trim()
    );

    if (isNameUniq) {
      createAlbum({
        data: {
          title: inputValue,
          subprojectId: subprojectId ?? "",
          isPublic: true,
          description: "",
          tags: [],
        },
      }).then(() => {
        showNotification({
          message: "Альбом создан",
          type: "success",
        });
        setIsModalOpen(false);
        void queryClient.invalidateQueries({
          queryKey: `/albums/subproject/${subprojectId}`,
        });
        setInputValue(`${formatDateWithMinutes(new Date())}`);
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
    setInputValue(`${formatDateWithMinutes(new Date())}`);
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
