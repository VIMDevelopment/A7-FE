import React, { FC } from "react";
import css from "./index.module.css";
import { Image } from "antd";

type Props = {
  url: string;
  name: string;
};

const PhotoCard: FC<Props> = ({ url, name }) => {
  return (
    <div className={css.container}>
      <div className={css.imgContainer}>
        <Image src={url} className={css.img} />
      </div>
      <div className={css.name}>{name}</div>
    </div>
  );
};

export default PhotoCard;
