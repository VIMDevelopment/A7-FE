import React from "react";
import css from "./index.module.css";
import {
  useGetProjectsProjectId,
  useGetSubprojects,
} from "../../apiV2/a7-service";
import { defaultApiAxiosParams } from "../../api/helpers";
import SubprojectCard from "./components/SubprojectCard/SubprojectCard";
import AddSubprojectCard from "./components/AddSubprojectCard/AddSubprojectCard";
import { Link, useParams } from "react-router-dom";
import { Breadcrumb } from "antd";
import { PublicRoutes } from "../../routes/routes";
import useBreadcrumbsBackButton from "../../lib/utils/useBreadcrumbsBackButton/useBreadcrumbsBackButton";
import YandexDiskProjectSyncControl from "../../components/YandexDiskProjectSyncControl/YandexDiskProjectSyncControl";

const ProjectPage = () => {
  const { projectId } = useParams();

  const { data: projectData } = useGetProjectsProjectId(projectId ?? "", {
    axios: defaultApiAxiosParams,
  });

  const { data } = useGetSubprojects(
    {
      projectId: projectId ?? "",
    },
    {
      axios: defaultApiAxiosParams,
    }
  );

  const allSubprojectsNames =
    data?.data.subprojects?.map((item) => item.name ?? "") ?? [];

  const projectName = projectData?.data.name ?? "";

  const { backButton } = useBreadcrumbsBackButton();

  return (
    <div className={css.container}>
      <div className={css.pageTitleRow}>
        <div className={css.pageTitle}>{`Все папки филиала "${projectName}"`}</div>
        <YandexDiskProjectSyncControl projectId={projectId ?? ""} />
      </div>
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
              title: `Филиал: "${projectName}"`,
            },
          ]}
        />
      </div>
      <div className={css.grid}>
        {data?.data.subprojects?.map((item) => (
          <SubprojectCard
            key={item.id}
            id={item.id}
            name={item.name}
          />
        ))}
        <AddSubprojectCard allSubprojectsNames={allSubprojectsNames} />
      </div>
    </div>
  );
};

export default ProjectPage;
