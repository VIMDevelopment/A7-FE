import React, { FC, PropsWithChildren } from "react";
import css from "./index.module.css";
import { Modal as AntdModal, ModalProps } from "antd";
import Button from "../Button/Button";

type Props = {
  okButtonName?: string;
  cancelButtonName?: string;
  isLoading?: boolean;
} & ModalProps &
  PropsWithChildren;

const Modal: FC<Props> = ({
  okButtonName,
  cancelButtonName,
  isLoading,
  children,
  ...props
}) => {
  return (
    <AntdModal
      {...props}
      rootClassName={css.modal}
      footer={
        <ModalFooter
          okButtonName={okButtonName}
          cancelButtonName={cancelButtonName}
          isLoading={isLoading}
          onOk={props.onOk}
          onCancel={props.onCancel}
        />
      }
    >
      {children}
    </AntdModal>
  );
};

export default Modal;

type FooterProps = {
  okButtonName?: string;
  cancelButtonName?: string;
  isLoading?: boolean;
} & Pick<ModalProps, "onOk" | "onCancel">;

const ModalFooter: FC<FooterProps> = ({
  okButtonName,
  cancelButtonName,
  isLoading,
  onOk,
  onCancel,
}) => (
  <div className={css.modalFooter}>
    <Button className={css.footerBtn} disabled={isLoading} onClick={onCancel}>
      {cancelButtonName || "Отмена"}
    </Button>
    <Button className={css.footerBtn} showSpinner={isLoading} onClick={onOk}>
      {okButtonName || "Сохранить"}
    </Button>
  </div>
);
