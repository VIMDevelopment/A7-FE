import React, { useState } from "react";
import css from "./index.module.css";
import AddProject from "./components/AddProjectCard/AddProjectCard";
import { useGetProjects } from "../../apiV2/a7-service";
import { defaultApiAxiosParams } from "../../api/helpers";
import ProjectCard from "./components/ProjectCard/ProjectCard";

const ProjectsPage = () => {
  const { data } = useGetProjects({
    axios: defaultApiAxiosParams,
  });

  return (
    <div className={css.container}>
      <div className={css.pageTitle}>Проекты</div>
      <div className={css.grid}>
        {data?.data?.projects?.map((item) => (
          <ProjectCard name={item.name} />
        ))}
        <AddProject />
      </div>
    </div>
  );
};

export default ProjectsPage;
