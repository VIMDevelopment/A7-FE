import React, { FC } from "react";
import css from "./index.module.css";

type Props = {
  id?: string;
  name?: string;
};

const ProjectCard: FC<Props> = ({ name }) => {
  return <div className={css.container}>{name ?? "Безымянный"}</div>;
};

export default ProjectCard;
