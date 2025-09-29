import React, { FC } from "react";
import css from "./index.module.css";
import { useNavigate } from "react-router-dom";
import { PublicRoutes } from "../../../../routes/routes";

type Props = {
  id?: string;
  name?: string;
  projectId?: string;
};

const AlbumCard: FC<Props> = ({ id, name, projectId }) => {
  const navigate = useNavigate();

  const handleProjectClick = () => {
    navigate(
      PublicRoutes.ALBUM.get({ projectId: projectId ?? "", albumId: id ?? "" })
    );
  };

  return (
    <div className={css.container} onClick={handleProjectClick}>
      <div className={css.albumPreviewContainer}>
        <div className={css.previewMock}></div>
        <div className={css.previewMock}></div>
        <div className={css.previewMock}></div>
        <div className={css.previewMock}></div>
      </div>
      {name ?? "Безымянный"}
    </div>
  );
};

export default AlbumCard;
