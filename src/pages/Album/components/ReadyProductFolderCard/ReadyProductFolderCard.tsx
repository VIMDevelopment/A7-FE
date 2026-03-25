import React, { FC } from "react";
import { Link } from "react-router-dom";
import { FolderOutlined } from "@ant-design/icons";
import css from "./index.module.css";

type Props = {
  to: string;
};

const ReadyProductFolderCard: FC<Props> = ({ to }) => {
  return (
    <Link to={to} className={css.mainContainer}>
      <div className={css.container}>
        <div className={css.previewArea}>
          <FolderOutlined className={css.folderIcon} />
        </div>
      </div>
      <span className={css.name}>Готовый продукт</span>
    </Link>
  );
};

export default ReadyProductFolderCard;
