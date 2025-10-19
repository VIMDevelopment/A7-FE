import React from "react";
import css from "./index.module.css";
import AddProject from "./components/AddProjectCard/AddProjectCard";
import { useGetProjects } from "../../apiV2/a7-service";
import { defaultApiAxiosParams } from "../../api/helpers";
import ProjectCard from "./components/ProjectCard/ProjectCard";

const ProjectsPage = () => {
  const { data } = useGetProjects({
    axios: defaultApiAxiosParams,
  });

  const allProjectsNames =
    data?.data?.projects?.map((item) => item.name ?? "") ?? [];

  return (
    <div className={css.container}>
      <div className={css.pageTitle}>Все проекты</div>
      <div className={css.grid}>
        {data?.data?.projects?.map((item) => (
          <ProjectCard key={item.id} id={item.id} name={item.name} />
        ))}
        <AddProject allProjectsNames={allProjectsNames} />
      </div>
    </div>
  );
};

export default ProjectsPage;
