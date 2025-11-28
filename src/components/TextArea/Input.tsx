import { InputRef } from "antd";
import React, { forwardRef } from "react";
import css from "./index.module.css";
import cn from "classnames";
import TextArea, { TextAreaProps } from "antd/es/input/TextArea";

type Props = {
  label?: string;
  className?: string;
} & TextAreaProps;

const InputTextArea = forwardRef<InputRef, Props>(
  ({ label, className, ...props }, ref) => {
    return (
      <div className={css.inputContainer}>
        <div className={css.label}>{label}</div>
        <TextArea {...props} className={cn(css.input, className)} ref={ref} />
      </div>
    );
  }
);

export default InputTextArea;
