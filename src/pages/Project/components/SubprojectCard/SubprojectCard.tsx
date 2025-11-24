import React, { FC, useState } from "react";
import css from "./index.module.css";
import { useNavigate, useParams } from "react-router-dom";
import { PublicRoutes } from "../../../../routes/routes";
import { Dropdown } from "antd";
import { MoreOutlined } from "@ant-design/icons";
import { ItemType } from "antd/es/menu/interface";
import Modal from "../../../../components/Modal/Modal";
import {
  getGetSubprojectsQueryKey,
  useDeleteSubprojects,
  usePutSubprojects,
} from "../../../../apiV2/a7-service";
import { defaultApiAxiosParams } from "../../../../api/helpers";
import { showNotification } from "../../../../components/ShowNotification";
import { useQueryClient } from "react-query";
import Input from "../../../../components/Input/Input";
import { useMediaQuery } from "react-responsive";

type Props = {
  id?: string;
  name?: string;
  allSubprojectsNames: string[];
};

const SubprojectCard: FC<Props> = ({ id, name, allSubprojectsNames }) => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const queryClient = useQueryClient();
  const isMobile = useMediaQuery({ maxWidth: 768 });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState(name ?? "");

  const { isLoading: isEditLoading, mutateAsync: updateSubproject } =
    usePutSubprojects({
      axios: defaultApiAxiosParams,
    });

  const { isLoading: isDeleteLoading, mutateAsync: deleteSubproject } =
    useDeleteSubprojects({
      axios: defaultApiAxiosParams,
    });

  const handleEditClick = () => {
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleEditOk = () => {
    const isNameUniq = !allSubprojectsNames.some(
      (item) => item.toLocaleLowerCase().trim() === inputValue.toLocaleLowerCase().trim()
    );

    if (isNameUniq) {
      updateSubproject({
        data: {
          id: id ?? "",
          projectId: projectId ?? "",
          name: inputValue,
        },
      }).then(() => {
        showNotification({
          message: "Папка переименована",
          type: "success",
        });
        setIsEditModalOpen(false);
        void queryClient.invalidateQueries({
          queryKey: getGetSubprojectsQueryKey({ projectId: projectId ?? "" }),
        });
      });
    } else {
      showNotification({
        type: "error",
        message:
          "Папка с таким названием уже существует. Пожалуйста, введите другое название.",
      });
    }
  };

  const handleDeleteOk = () => {
    deleteSubproject({
      data: {
        id: id ?? "",
      },
    }).then(() => {
      showNotification({
        message: "Папка удалена",
        type: "success",
      });
      setIsDeleteModalOpen(false);
      void queryClient.invalidateQueries({
        queryKey: getGetSubprojectsQueryKey({ projectId: projectId ?? "" }),
      });
    });
  };

  const handleEditCancel = () => {
    setIsEditModalOpen(false);
    setInputValue(name ?? "");
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
  };

  const handleSubrojectClick = () => {
    navigate(
      PublicRoutes.SUBPROJECT.get({
        projectId: projectId ?? "",
        subprojectId: id ?? "",
      })
    );
  };

  const items: ItemType[] = [
    {
      key: "1",
      label: "Переименовать",
      onClick: handleEditClick,
    },
    {
      key: "2",
      label: "Удалить",
      danger: true,
      onClick: handleDeleteClick,
    },
  ];

  return (
    <div>
      <div className={css.actionMenuIconContainer}>
        <div className={css.menuIconButton}>
          <Dropdown
            overlayClassName={css.dropdown}
            placement="bottomRight"
            menu={{ items }}
            trigger={["click"]}
          >
            <MoreOutlined
              style={{
                color: "white",
                fontSize: isMobile ? "30px" : "unset",
              }}
            />
          </Dropdown>
        </div>
      </div>
      <div className={css.container} onClick={handleSubrojectClick}>
        {name ?? "Безымянный"}
      </div>

      <Modal
        title={"Редактирование папки"}
        open={isEditModalOpen}
        onOk={handleEditOk}
        onCancel={handleEditCancel}
        okButtonName="Сохранить"
        destroyOnHidden
        isLoading={isEditLoading}
      >
        <Input
          label="Введите название"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
      </Modal>
      <Modal
        title={"Удаление папки"}
        open={isDeleteModalOpen}
        onOk={handleDeleteOk}
        onCancel={handleDeleteCancel}
        okButtonName="Удалить"
        destroyOnHidden
        isLoading={isDeleteLoading}
        customOkButtonClassName={css.deleteButton}
      >
        {`Вы уверены, что хотите удалить папку "${name}"? Все данные будут безвозвратно
        утеряны.`}
      </Modal>
    </div>
  );
};

export default SubprojectCard;
