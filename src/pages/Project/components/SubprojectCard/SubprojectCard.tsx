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
} from "../../../../apiV2/a7-service";
import { defaultApiAxiosParams } from "../../../../api/helpers";
import { showNotification } from "../../../../components/ShowNotification";
import { useQueryClient } from "react-query";
import { useMediaQuery } from "react-responsive";

type Props = {
  id?: string;
  name?: string;
};

const SubprojectCard: FC<Props> = ({ id, name }) => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const queryClient = useQueryClient();
  const isMobile = useMediaQuery({ maxWidth: 768 });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const { isLoading: isDeleteLoading, mutateAsync: deleteSubproject } =
    useDeleteSubprojects({
      axios: defaultApiAxiosParams,
    });

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
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
