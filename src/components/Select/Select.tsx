import { Select as AntdSelect } from "antd";
import { SelectProps } from "antd/es/select";
import React, { FC } from "react";
import css from "./index.module.css";
import cn from "classnames";

type Props = {
  label?: string;
  searchable?: boolean;
} & SelectProps;

const filterByLabelSubstring = (
  input: string,
  option?: { label?: React.ReactNode }
) =>
  String(option?.label ?? "")
    .toLowerCase()
    .includes(input.trim().toLowerCase());

const Select: FC<Props> = ({ label, searchable, disabled, ...props }) => {
  return (
    <div className={css.selectContainer}>
      <div className={css.label}>{label}</div>
      <AntdSelect
        id={`${label}`}
        rootClassName={cn(css.root, disabled && css.disabled)}
        className={css.select}
        disabled={disabled}
        {...(searchable && {
          showSearch: true,
          optionFilterProp: "label",
          filterOption: filterByLabelSubstring,
        })}
        {...props}
      />
    </div>
  );
};

export default Select;
