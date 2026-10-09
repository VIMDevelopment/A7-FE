import React, { FC } from "react";
import css from "./index.module.css";

/** Вместо выбора филиалов у «Суперадмина»: он видит все филиалы, в том числе созданные позже. */
export const AllBranchesNote: FC<{ label: string }> = ({ label }) => (
  <div className={css.allBranches}>
    <div className={css.allBranchesLabel}>{label}</div>
    <div className={css.allBranchesText}>
      Все филиалы — нынешние и будущие. Суперадмину выбирать филиалы не нужно.
    </div>
  </div>
);

/** Подсказка под ролями: с «Суперадмином» другие роли не нужны. */
export const SuperadminRolesHint: FC = () => (
  <div className={css.rolesHint}>
    Суперадмин включает все права — другие роли не нужны.
  </div>
);
