import React, { FC, PropsWithChildren } from "react";
import css from "./index.module.css";
import { Modal as AntdModal, ModalProps } from "antd";
import Button from "../Button/Button";
import cn from "classnames";
import { useEnterPressListener } from "../../lib/utils/useEnterPressListener";

type Props = {
  okButtonName?: string;
  cancelButtonName?: string;
  isLoading?: boolean;
  customOkButtonClassName?: string;
  withFooter?: boolean;
  blur?: boolean;
  customRootClassName?: string;
} & ModalProps &
  PropsWithChildren;

const Modal: FC<Props> = ({
  okButtonName,
  cancelButtonName,
  isLoading,
  children,
  customOkButtonClassName,
  withFooter = true,
  blur,
  customRootClassName,
  ...props
}) => {
  useEnterPressListener(() => {
    if (!props.open) return;
    const activeTag = (document.activeElement as HTMLElement).tagName;
    if (activeTag === "TEXTAREA" || activeTag === "BUTTON") return;
    props.onOk?.({} as any);
  });

  return (
    <AntdModal
      {...props}
      rootClassName={cn(css.modal, blur && css.modalBlur, customRootClassName)}
      footer={
        withFooter && (
          <ModalFooter
            okButtonName={okButtonName}
            cancelButtonName={cancelButtonName}
            isLoading={isLoading}
            onOk={props.onOk}
            onCancel={props.onCancel}
            customOkButtonClassName={customOkButtonClassName}
          />
        )
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
