import React from "react";
import css from "./index.module.css";
import {
  useGetAlbumsSubprojectSubprojectId,
  useGetProjectsProjectId,
  useGetSubprojectsId,
} from "../../apiV2/a7-service";
import { defaultApiAxiosParams } from "../../api/helpers";
import { Link, useParams } from "react-router-dom";
import AlbumCard from "./components/AlbumCard/AlbumCard";
import AddAlbumCard from "./components/AddAlbumCard/AddAlbumCard";
import { Breadcrumb } from "antd";
import { PublicRoutes } from "../../routes/routes";
import useBreadcrumbsBackButton from "../../lib/utils/useBreadcrumbsBackButton/useBreadcrumbsBackButton";

const SubprojectPage = () => {
  const { projectId, subprojectId } = useParams();

  const { data: projectData } = useGetProjectsProjectId(projectId ?? "", {
    axios: defaultApiAxiosParams,
  });

  const { data: subprojectData } = useGetSubprojectsId(subprojectId ?? "", {
    axios: defaultApiAxiosParams,
  });

  const { data: albumsData } = useGetAlbumsSubprojectSubprojectId(
    subprojectId ?? "",
    {
      axios: defaultApiAxiosParams,
    }
  );

  const projectName = projectData?.data.name ?? "";
  const subprojectName = subprojectData?.data.name ?? "";

  const allAlbumsNames = albumsData?.data.map((item) => item.title ?? "") ?? [];

  return (
    <div className={css.container}>
      <div className={css.pageTitle}>{subprojectName}</div>
      <div className={css.navMenu}>
        <Breadcrumb
          className={css.breadCrumbs}
          separator=""
          items={[
            ...useBreadcrumbsBackButton(),
            {
              title: <Link to={PublicRoutes.PROJECTS.static}>Все проекты</Link>,
            },
            {
              type: "separator",
            },
            {
              title: (
                <Link
                  to={PublicRoutes.PROJECT.get({ projectId: projectId ?? "" })}
                >
                  {`Проект: "${projectName}"`}
                </Link>
              ),
            },
            {
              type: "separator",
            },
            {
              title: `Папка: "${subprojectName}"`,
            },
          ]}
        />
      </div>
      <div className={css.grid}>
        {albumsData?.data.map((item) => (
          <AlbumCard
            key={item.id}
            id={item.id}
            name={item.title}
            coverId={item.coverPhotoId}
            isProcessed={item.processed}
          />
        ))}
        <AddAlbumCard allAlbumsNames={allAlbumsNames} />
      </div>
    </div>
  );
};

export default SubprojectPage;
