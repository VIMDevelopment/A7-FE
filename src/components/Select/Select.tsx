import { Select as AntdSelect } from "antd";
import { DefaultOptionType, SelectProps } from "antd/es/select";
import React, { FC, useMemo, useState } from "react";
import css from "./index.module.css";
import cn from "classnames";

type Props = {
  label?: string;
  searchable?: boolean;
  showSelectAll?: boolean;
} & SelectProps;

const filterByLabelSubstring = (
  input: string,
  option?: { label?: React.ReactNode }
) =>
  String(option?.label ?? "")
    .toLowerCase()
    .includes(input.trim().toLowerCase());

const Select: FC<Props> = ({
  label,
  searchable,
  disabled,
  showSelectAll,
  ...rest
}) => {
  const [searchValue, setSearchValue] = useState("");
  const isMultiple = rest.mode === "multiple" || rest.mode === "tags";
  const enableSelectAll = !!showSelectAll && isMultiple;

  const flatEnabledValues = useMemo(() => {
    if (!enableSelectAll) return [] as (string | number)[];
    const acc: (string | number)[] = [];
    const walk = (opts?: DefaultOptionType[]) => {
      opts?.forEach((o) => {
        if (o.options) {
          walk(o.options as DefaultOptionType[]);
        } else if (!o.disabled && o.value !== undefined) {
          acc.push(o.value as string | number);
        }
      });
    };
    walk(rest.options as DefaultOptionType[] | undefined);
    return acc;
  }, [rest.options, enableSelectAll]);

  const filteredValues = useMemo(() => {
    if (!enableSelectAll) return [] as (string | number)[];
    if (!searchValue) return flatEnabledValues;
    const opts = (rest.options ?? []) as DefaultOptionType[];
    const flat: DefaultOptionType[] = [];
    const walk = (list?: DefaultOptionType[]) => {
      list?.forEach((o) => {
        if (o.options) walk(o.options as DefaultOptionType[]);
        else if (!o.disabled) flat.push(o);
      });
    };
    walk(opts);
    return flat
      .filter((o) => filterByLabelSubstring(searchValue, o))
      .map((o) => o.value as string | number);
  }, [enableSelectAll, searchValue, flatEnabledValues, rest.options]);

  const currentValue = (rest.value ?? []) as (string | number)[];

  const allFilteredSelected =
    filteredValues.length > 0 &&
    filteredValues.every((v) => currentValue.includes(v));
  const someFilteredSelected = filteredValues.some((v) =>
    currentValue.includes(v)
  );

  const handleSelectAll: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const next = Array.from(new Set([...currentValue, ...filteredValues]));
    rest.onChange?.(next, []);
  };

  const handleClearAll: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const toRemove = new Set(filteredValues);
    const next = currentValue.filter((v) => !toRemove.has(v));
    rest.onChange?.(next, []);
  };

  const selectAllPopupRender: SelectProps["popupRender"] = (menu) => (
    <>
      <div
        className={css.selectAllPanel}
        onMouseDown={(e) => e.preventDefault()}
      >
        <button
          type="button"
          className={css.selectAllBtn}
          onClick={handleSelectAll}
          disabled={allFilteredSelected || filteredValues.length === 0}
        >
          Выбрать все
        </button>
        <button
          type="button"
          className={cn(css.selectAllBtn, css.selectAllBtnSecondary)}
          onClick={handleClearAll}
          disabled={!someFilteredSelected}
        >
          Сбросить
        </button>
      </div>
      {menu}
    </>
  );

  const selectProps: SelectProps = {
    ...(searchable && {
      showSearch: true,
      optionFilterProp: "label",
      filterOption: filterByLabelSubstring,
    }),
    ...rest,
  };

  if (enableSelectAll) {
    selectProps.popupRender = rest.popupRender ?? selectAllPopupRender;
    const originalOnSearch = rest.onSearch;
    selectProps.onSearch = (val: string) => {
      setSearchValue(val);
      originalOnSearch?.(val);
    };
  }

  return (
    <div className={css.selectContainer}>
      <div className={css.label}>{label}</div>
      <AntdSelect
        id={`${label}`}
        rootClassName={cn(css.root, disabled && css.disabled)}
        className={css.select}
        disabled={disabled}
        {...selectProps}
      />
    </div>
  );
};

export default Select;
