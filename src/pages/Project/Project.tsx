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

  const projectName = projectData?.data.name;

  const { backButton } = useBreadcrumbsBackButton();

  return (
    <div className={css.container}>
      <div className={css.pageTitle}>{`Все папки проекта ${projectName}`}</div>
      <div className={css.navMenu}>
        <Breadcrumb
          className={css.breadCrumbs}
          separator=""
          items={[
            ...backButton,
            {
              title: <Link to={PublicRoutes.PROJECTS.static}>Все проекты</Link>,
            },
            {
              type: "separator",
            },
            {
              title: `Проект: "${projectName ?? ""}"`,
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
            allSubprojectsNames={allSubprojectsNames}
          />
        ))}
        <AddSubprojectCard allSubprojectsNames={allSubprojectsNames} />
      </div>
    </div>
  );
};

export default ProjectPage;
