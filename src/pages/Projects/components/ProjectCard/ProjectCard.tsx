import React, { FC, useState } from "react";
import css from "./index.module.css";
import { useNavigate } from "react-router-dom";
import { PublicRoutes } from "../../../../routes/routes";
import { Dropdown } from "antd";
import { MoreOutlined } from "@ant-design/icons";
import { ItemType } from "antd/es/menu/interface";
import Modal from "../../../../components/Modal/Modal";
import {
  useDeleteProjectsDelete,
  useGetProjects,
  usePutProjectsUpdate,
} from "../../../../apiV2/a7-service";
import { defaultApiAxiosParams } from "../../../../api/helpers";
import { showNotification } from "../../../../components/ShowNotification";
import { useQueryClient } from "react-query";
import Input from "../../../../components/Input/Input";
import { useMediaQuery } from "react-responsive";

type Props = {
  id?: string;
  name?: string;
};

const ProjectCard: FC<Props> = ({ id, name }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isMobile = useMediaQuery({ maxWidth: 768 });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState(name ?? "");

  const { isLoading: isEditLoading, mutateAsync: updateProject } =
    usePutProjectsUpdate({
      axios: defaultApiAxiosParams,
    });

  const { isLoading: isDeleteLoading, mutateAsync: deleteProject } =
    useDeleteProjectsDelete({
      axios: defaultApiAxiosParams,
    });

  const { data: allProjectsData } = useGetProjects({
    axios: defaultApiAxiosParams,
  });

  const allProjectsNames =
    allProjectsData?.data.projects?.map((item) => item.name ?? "") ?? [];

  const handleEditClick = () => {
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleEditOk = () => {
    const isNameUniq = !allProjectsNames.some(
      (item) => item.toLocaleLowerCase().trim() === inputValue.toLocaleLowerCase().trim()
    );

    if (isNameUniq) {
      updateProject({
        data: {
          id: id ?? "",
          name: inputValue,
        },
      }).then(() => {
        showNotification({
          message: "Проект переименован",
          type: "success",
        });
        setIsEditModalOpen(false);
        void queryClient.invalidateQueries({ queryKey: "/projects" });
      });
    } else {
      showNotification({
        type: "error",
        message:
          "Проект с таким названием уже существует. Пожалуйста, введите другое название.",
      });
    }
  };

  const handleDeleteOk = () => {
    deleteProject({
      data: {
        id: id ?? "",
      },
    }).then(() => {
      showNotification({
        message: "Проект удален",
        type: "success",
      });
      setIsDeleteModalOpen(false);
      void queryClient.invalidateQueries({ queryKey: "/projects" });
      navigate(PublicRoutes.PROJECTS.static);
    });
  };

  const handleEditCancel = () => {
    setIsEditModalOpen(false);
    setInputValue(name ?? "");
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
  };

  const handleProjectClick = () => {
    navigate(PublicRoutes.PROJECT.get({ projectId: id ?? "" }));
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
      <div className={css.container} onClick={handleProjectClick}>
        {name ?? "Безымянный"}
      </div>

      <Modal
        title={"Редактирование проекта"}
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
        title={"Удаление проекта"}
        open={isDeleteModalOpen}
        onOk={handleDeleteOk}
        onCancel={handleDeleteCancel}
        okButtonName="Удалить"
        destroyOnHidden
        isLoading={isDeleteLoading}
        customOkButtonClassName={css.deleteButton}
      >
        {`Вы уверены, что хотите удалить проект "${name}"? Все данные будут безвозвратно
        утеряны.`}
      </Modal>
    </div>
  );
};

export default ProjectCard;
