import React from "react";
import css from "./index.module.css";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { BreadcrumbItemType } from "antd/es/breadcrumb/Breadcrumb";

const useBreadcrumbsBackButton: () => {
  backButton: BreadcrumbItemType[];
} = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  return {
    backButton: [
      {
        title: (
          <div className={css.backArrowContainer} onClick={handleGoBack}>
            <ArrowLeftOutlined />
          </div>
        ),
      },
    ],
  };
};

export default useBreadcrumbsBackButton;
