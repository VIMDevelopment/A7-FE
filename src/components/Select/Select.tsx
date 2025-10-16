import { Select as AntdSelect } from "antd";
import { Option } from "antd/es/mentions";
import { DefaultOptionType, SelectProps } from "antd/es/select";
import React, { FC } from "react";
import css from "./index.module.css";
import cn from 'classnames';

type Props = {
  label?: string;
} & SelectProps;

const Select: FC<Props> = ({ label, ...props }) => {
  return (
    <div className={css.selectContainer}>
      <div className={css.label}>{label}</div>
      <AntdSelect rootClassName={cn(css.root, props.disabled && css.disabled)} className={css.select} {...props} />
    </div>
  );
};

export default Select;
