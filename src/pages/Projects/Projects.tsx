import React from "react";
import css from "./index.module.css";
import AddProject from "./components/AddProjectCard/AddProjectCard";
import { useGetProjects } from "../../apiV2/a7-service";
import { defaultApiAxiosParams } from "../../api/helpers";
import ProjectCard from "./components/ProjectCard/ProjectCard";
import { useProfile } from "../../auth/auth";
import { useShowPermissions } from "../../auth/userData";
import { UserRole } from "../../apiV2/a7-service/model";

const ProjectsPage = () => {
  const { data } = useGetProjects({
    axios: defaultApiAxiosParams,
  });

  const { data: userData } = useProfile();

  const { hasPrivileges } = useShowPermissions();

  const hasAllowToAllProjects = hasPrivileges([
    UserRole.admin,
    UserRole.owner,
    UserRole.agency,
    UserRole.cluster,
  ]);

  const canMakeNewProject = hasPrivileges([
    UserRole.admin,
    UserRole.owner,
    UserRole.agency,
    UserRole.cluster,
  ]);

  const allowedProjects = hasAllowToAllProjects
    ? data?.data.projects ?? []
    : data?.data.projects?.filter((item) =>
        userData?.workplace?.includes(item.id ?? "")
      );

  const allProjectsNames =
    data?.data.projects?.map((item) => item.name ?? "") ?? [];

  return (
    <div className={css.container}>
      <div className={css.pageTitle}>Все филиалы</div>
      <div className={css.grid}>
        {allowedProjects?.map((item) => (
          <ProjectCard key={item.id} id={item.id} name={item.name} />
        ))}
        {canMakeNewProject && (
          <AddProject allProjectsNames={allProjectsNames} />
        )}
      </div>
    </div>
  );
};

export default ProjectsPage;
