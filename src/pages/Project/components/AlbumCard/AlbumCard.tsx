import React, { FC } from "react";
import css from "./index.module.css";
import { useNavigate } from "react-router-dom";
import { PublicRoutes } from "../../../../routes/routes";
import { useGetPhotosId } from "../../../../apiV2/a7-service";
import { defaultApiAxiosParams } from "../../../../api/helpers";

type Props = {
  id?: string;
  name?: string;
  projectId?: string;
  coverId?: string;
};

const AlbumCard: FC<Props> = ({ id, name, projectId, coverId }) => {
  const navigate = useNavigate();

  const { data, isError, isLoading } = useGetPhotosId(coverId ?? "", {
    axios: defaultApiAxiosParams,
    query: {
      onError: () => {},
    },
  });

  const handleProjectClick = () => {
    navigate(
      PublicRoutes.ALBUM.get({ projectId: projectId ?? "", albumId: id ?? "" })
    );
  };

  return (
    <div className={css.container} onClick={handleProjectClick}>
      {coverId && !isError && !isLoading ? (
        <div className={css.imgContainer}>
          <img className={css.img} src={data?.data?.fileUrl} alt="" />
        </div>
      ) : (
        <div className={css.albumPreviewContainer}>
          <div className={css.previewMock}></div>
          <div className={css.previewMock}></div>
          <div className={css.previewMock}></div>
          <div className={css.previewMock}></div>
        </div>
      )}
      {name ?? "Безымянный"}
    </div>
  );
};

export default AlbumCard;
