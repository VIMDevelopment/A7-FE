import React from "react";
import css from "./index.module.css";
import {
  useGetAlbumsProjectProjectId,
  useGetProjectsId,
} from "../../apiV2/a7-service";
import { defaultApiAxiosParams } from "../../api/helpers";
import { useNavigate, useParams } from "react-router-dom";
import AlbumCard from "./components/AlbumCard/AlbumCard";
import AddAlbumCard from "./components/AddAlbumCard/AddAlbumCard";
import { Breadcrumb } from "antd";
import { PublicRoutes } from "../../routes/routes";

const ProjectPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const { data: projectData } = useGetProjectsId(projectId ?? "", {
    axios: defaultApiAxiosParams,
  });

  const { data: albumsData } = useGetAlbumsProjectProjectId(projectId ?? "", {
    axios: defaultApiAxiosParams,
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
            title: `"${projectData?.data?.name ?? ""}"`,
          },
        ]}
      />
      <div className={css.grid}>
        {albumsData?.data?.map((item) => (
          <AlbumCard
            projectId={projectId}
            key={item.id}
            id={item.id}
            name={item.title}
            coverId={item.coverPhotoId}
          />
        ))}
        <AddAlbumCard projectId={projectId ?? ""} />
      </div>
    </div>
  );
};

export default ProjectPage;
