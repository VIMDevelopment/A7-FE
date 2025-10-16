import { Input as AntdInput, InputProps } from "antd";
import React, { FC, useState } from "react";
import css from "./index.module.css";
import cn from "classnames";
import { EyeInvisibleOutlined, EyeOutlined } from "@ant-design/icons";

type Props = {
  label?: string;
  className?: string;
  isPasswordInput?: boolean;
} & InputProps;

const Input: FC<Props> = ({ label, className, isPasswordInput, ...props }) => {
  const [isVisiblePassword, setIsVisiblePassword] = useState(false);

  return (
    <div className={css.inputContainer}>
      <div className={css.label}>{label}</div>
      {isPasswordInput ? (
        <div className={css.passwordInputContainer}>
          <AntdInput
            {...props}
            className={cn(css.input, className)}
            type={isVisiblePassword ? props.type : "password"}
          />
          <div className={css.eyeContainer}>
            {!isVisiblePassword ? (
              <EyeOutlined
                onClick={() => setIsVisiblePassword((prev) => !prev)}
              />
            ) : (
              <EyeInvisibleOutlined
                onClick={() => setIsVisiblePassword((prev) => !prev)}
              />
            )}
          </div>
        </div>
      ) : (
        <AntdInput {...props} className={cn(css.input, className)} />
      )}
    </div>
  );
};

export default Input;
