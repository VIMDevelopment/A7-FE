import React, { FC } from "react";
import css from "./index.module.css";

type Props = {
  url: string;
  name: string;
};

const PhotoCard: FC<Props> = ({ url, name }) => {
  return (
    <div className={css.container}>
      <div className={css.imgContainer}>
        <img className={css.img} src={url} />
      </div>
      <div className={css.name}>{name}</div>
    </div>
  );
};

export default PhotoCard;
