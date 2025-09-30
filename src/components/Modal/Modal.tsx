import React, { FC, PropsWithChildren } from "react";
import css from "./index.module.css";
import { Modal as AntdModal, ModalProps } from "antd";
import Button from "../Button/Button";
import cn from "classnames";

type Props = {
  okButtonName?: string;
  cancelButtonName?: string;
  isLoading?: boolean;
  customOkButtonClassName?: string;
} & ModalProps &
  PropsWithChildren;

const Modal: FC<Props> = ({
  okButtonName,
  cancelButtonName,
  isLoading,
  children,
  customOkButtonClassName,
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
          customOkButtonClassName={customOkButtonClassName}
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
  customOkButtonClassName?: string;
} & Pick<ModalProps, "onOk" | "onCancel">;

const ModalFooter: FC<FooterProps> = ({
  okButtonName,
  cancelButtonName,
  isLoading,
  customOkButtonClassName,
  onOk,
  onCancel,
}) => (
  <div className={css.modalFooter}>
    <Button className={css.footerBtn} disabled={isLoading} onClick={onCancel}>
      {cancelButtonName || "Отмена"}
    </Button>
    <Button
      className={cn(css.footerBtn, customOkButtonClassName)}
      showSpinner={isLoading}
      onClick={onOk}
    >
      {okButtonName || "Сохранить"}
    </Button>
  </div>
);
