import React, { useEffect, useMemo, useState } from "react";
import { Skeleton } from "antd";
import cn from "classnames";
import css from "./index.module.css";
import {
  useGetProjects,
  useGetPhotosProcessingusageSummary,
} from "../../apiV2/a7-service";
import { defaultApiAxiosParams } from "../../api/helpers";
import { useProfile } from "../../auth/auth";
import { useShowPermissions } from "../../auth/userData";
import { UserRole } from "../../apiV2/a7-service/model";
import Select from "../../components/Select/Select";
import Button from "../../components/Button/Button";

type Period = "allTime" | "lastMonth" | "lastWeek" | "lastDay";

type ProcessingUsageSummary = {
  allTime: number;
  lastMonth: number;
  lastWeek: number;
  lastDay: number;
};

const PERIODS: { id: Period; label: string }[] = [
  { id: "allTime", label: "Всё время" },
  { id: "lastMonth", label: "Последние 30 дней" },
  { id: "lastWeek", label: "Последние 7 дней" },
  { id: "lastDay", label: "Сегодня" },
];

const rubFormatter = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  maximumFractionDigits: 0,
});

const StatisticsPage = () => {
  const { data: projectsData } = useGetProjects({
    axios: defaultApiAxiosParams,
  });
  const { data: user } = useProfile();
  const { hasPrivileges } = useShowPermissions();

  const hasAllowToAllProjects = hasPrivileges([
    UserRole.admin,
    UserRole.owner,
    UserRole.agency,
    UserRole.cluster,
  ]);

  const availableProjects = useMemo(() => {
    const projects = projectsData?.data.projects ?? [];
    if (hasAllowToAllProjects) return projects;
    return projects.filter((item) =>
      user?.workplace?.includes(item.id ?? "")
    );
  }, [projectsData, hasAllowToAllProjects, user?.workplace]);

  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [period, setPeriod] = useState<Period>("allTime");

  useEffect(() => {
    if (!selectedProjectId && availableProjects.length > 0) {
      setSelectedProjectId(availableProjects[0].id ?? "");
    }
  }, [availableProjects, selectedProjectId]);

  const { data: summaryResponse, isLoading: isSummaryLoading } =
    useGetPhotosProcessingusageSummary(
      { projectId: selectedProjectId },
      {
        axios: defaultApiAxiosParams,
        query: { enabled: !!selectedProjectId },
      }
    );

  const summary = summaryResponse?.data as ProcessingUsageSummary | undefined;
  const value = summary?.[period] ?? 0;

  const projectOptions = useMemo(
    () =>
      availableProjects.map((item) => ({
        label: item.name ?? "",
        value: item.id ?? "",
      })),
    [availableProjects]
  );

  const hasNoProjects = availableProjects.length === 0;

  return (
    <div className={css.container}>
      <div className={css.pageTitle}>Статистика</div>

      {hasNoProjects ? (
        <div className={css.emptyState}>Нет доступных филиалов</div>
      ) : (
        <div className={css.content}>
          <div className={css.selectWrapper}>
            <Select
              label="Филиал"
              placeholder="Выберите филиал"
              value={selectedProjectId || undefined}
              onChange={(val) => setSelectedProjectId(val ?? "")}
              options={projectOptions}
            />
          </div>

          <div className={css.periodSwitcher}>
            {PERIODS.map((item) => (
              <Button
                key={item.id}
                className={cn(
                  css.periodButton,
                  period === item.id && css.periodButtonActive
                )}
                onClick={() => setPeriod(item.id)}
              >
                {item.label}
              </Button>
            ))}
          </div>

          <div className={css.card}>
            <div className={css.cardLabel}>Затраты на ИИ</div>
            {isSummaryLoading ? (
              <Skeleton.Input
                active
                size="large"
                style={{ width: 220, height: 40 }}
              />
            ) : (
              <div className={css.cardValue}>{rubFormatter.format(value)}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatisticsPage;
