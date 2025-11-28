import { Input as AntdInput, InputProps, InputRef } from "antd";
import React, { forwardRef, useState } from "react";
import css from "./index.module.css";
import cn from "classnames";
import { EyeInvisibleOutlined, EyeOutlined } from "@ant-design/icons";

type Props = {
  label?: string;
  className?: string;
  isPasswordInput?: boolean;
} & InputProps;

const Input = forwardRef<InputRef, Props>(
  ({ label, className, isPasswordInput, ...props }, ref) => {
    const [isVisiblePassword, setIsVisiblePassword] = useState(false);

    return (
      <div className={css.inputContainer}>
        <div className={cn(css.label, props.status === "error" && css.error)}>
          {label}
        </div>
        {isPasswordInput ? (
          <div className={css.passwordInputContainer}>
            <AntdInput
              {...props}
              className={cn(css.input, className)}
              type={isVisiblePassword ? props.type : "password"}
              ref={ref}
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
          <AntdInput
            {...props}
            className={cn(css.input, className)}
            ref={ref}
          />
        )}
      </div>
    );
  }
);

export default Input;
