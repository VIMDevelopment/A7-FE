import React, { useMemo } from "react";
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

  const sortedAlbums = useMemo(() => {
    const data = albumsData?.data ?? [];
    return [...data].sort((a, b) => {
      const matchA = (a.title ?? "").match(/^(\d{1,2})/);
      const matchB = (b.title ?? "").match(/^(\d{1,2})/);
      const numA = matchA ? parseInt(matchA[1], 10) : 999;
      const numB = matchB ? parseInt(matchB[1], 10) : 999;
      return numA - numB;
    });
  }, [albumsData?.data]);

  const { backButton } = useBreadcrumbsBackButton();

  return (
    <div className={css.container}>
      <div className={css.pageTitle}>{`Папка: "${subprojectName}"`}</div>
      <div className={css.navMenu}>
        <Breadcrumb
          className={css.breadCrumbs}
          separator=""
          items={[
            ...backButton,
            {
              title: <Link to={PublicRoutes.PROJECTS.static}>Все филиалы</Link>,
            },
            {
              type: "separator",
            },
            {
              title: (
                <Link
                  to={PublicRoutes.PROJECT.get({ projectId: projectId ?? "" })}
                >
                  {`Филиал: "${projectName}"`}
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
        {sortedAlbums.map((item) => (
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
