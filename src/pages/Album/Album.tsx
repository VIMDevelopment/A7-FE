import React from "react";
import css from "./index.module.css";
import { Breadcrumb } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { PublicRoutes } from "../../routes/routes";
import {
  useGetAlbumsId,
  useGetPhotosAlbumAlbumId,
  useGetProjectsId,
} from "../../apiV2/a7-service";
import { defaultApiAxiosParams } from "../../api/helpers";
import UploadBox from "./components/UploadBox/UploadBox";
import PhotoCard from "./components/PhotoCard/PhotoCard";

const AlbumPage = () => {
  const { projectId, albumId } = useParams();
  const navigate = useNavigate();

  const { data: projectData } = useGetProjectsId(projectId ?? "", {
    axios: defaultApiAxiosParams,
  });

  const { data: albumData } = useGetAlbumsId(albumId ?? "", {
    axios: defaultApiAxiosParams,
  });

  const { data: albumPhotosData } = useGetPhotosAlbumAlbumId(albumId ?? "", {
    axios: defaultApiAxiosParams,
  });

  const albumPhotos = albumPhotosData?.data?.sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateA - dateB;
  });

  const handleProjectsClick = () => {
    navigate(PublicRoutes.PROJECTS.static);
  };

  return (
    <div className={css.container}>
      <div className={css.pageTitle} onClick={handleProjectsClick}>
        Проекты
      </div>
      <Breadcrumb
        separator=""
        items={[
          {
            title: "Проект",
          },
          {
            type: "separator",
            separator: ":",
          },
          {
            href: PublicRoutes.PROJECT.get({ projectId: projectId ?? "" }),
            title: `"${projectData?.data?.name ?? ""}"`,
          },
          {
            type: "separator",
          },
          {
            title: `${albumData?.data?.title ?? ""}`,
          },
        ]}
      />
      {albumPhotos?.length === 0 ? (
        <UploadBox size="big" albumId={albumId ?? ""} />
      ) : (
        <div className={css.grid}>
          {albumPhotos?.map((item) => (
            <PhotoCard key={item.id} url={item.fileUrl} name={item.fileName} />
          ))}
          <UploadBox size="small" albumId={albumId ?? ""} />
        </div>
      )}
    </div>
  );
};

export default AlbumPage;
