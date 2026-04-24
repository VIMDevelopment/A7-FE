import { Button as AntdButton, ButtonProps, Spin } from "antd";
import React, { FC, PropsWithChildren } from "react";
import css from "./index.module.css";
import cn from "classnames";
import { LoadingOutlined } from "@ant-design/icons";

type Props = {
  className?: string;
  showSpinner?: boolean;
} & ButtonProps &
  PropsWithChildren;

const Button: FC<Props> = ({ className, showSpinner, children, ...props }) => {
  return (
    <AntdButton className={cn(css.button, className)} {...props}>
      {showSpinner ? (
        <Spin
          indicator={<LoadingOutlined spin style={{ color: "#ffffff" }} />}
        />
      ) : (
        <>{children}</>
      )}
    </AntdButton>
  );
};

export default Button;
