import React, { FC } from "react";
import css from "./index.module.css";
import { Image } from "antd";
import Checkbox from "antd/es/checkbox/Checkbox";

type Props = {
  id: string;
  url: string;
  name: string;
  isSelected: boolean;
  onSelect: (id: string) => void;
};

const PhotoCard: FC<Props> = ({ id, url, name, isSelected, onSelect }) => {
  return (
    <div className={css.container}>
      <div className={css.checkboxContainer}>
        <Checkbox
          className={css.checkbox}
          checked={isSelected}
          onClick={() => onSelect(id)}
        />
      </div>
      <div className={css.imgContainer}>
        <Image src={url} className={css.img} />
      </div>
      <div className={css.name}>{name}</div>
    </div>
  );
};

export default PhotoCard;
