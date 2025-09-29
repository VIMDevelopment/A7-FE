import React, { FC } from "react";
import css from "./index.module.css";
import { useNavigate } from "react-router-dom";
import { PublicRoutes } from "../../../../routes/routes";

type Props = {
  id?: string;
  name?: string;
};

const ProjectCard: FC<Props> = ({ id, name }) => {
  const navigate = useNavigate();

  const handleProjectClick = () => {
    navigate(PublicRoutes.PROJECT.get({ projectId: id ?? '' }));
  };

  return (
    <div className={css.container} onClick={handleProjectClick}>
      {name ?? "Безымянный"}
    </div>
  );
};

export default ProjectCard;
