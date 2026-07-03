import React, { useEffect, useMemo, useState } from "react";
import { DatePicker, Skeleton } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import "dayjs/locale/ru";
import css from "./index.module.css";
import { useGetProjects, useGetPhotosProcessingusage } from "../../apiV2/a7-service";
import { defaultApiAxiosParams } from "../../api/helpers";
import { useProfile } from "../../auth/auth";
import { useShowPermissions } from "../../auth/userData";
import { UserRolesItem } from "../../apiV2/a7-service/model";
import Select from "../../components/Select/Select";
import { formatUTCDate } from "../../lib/formatters/date";

const { RangePicker } = DatePicker;

dayjs.locale("ru");

type ProcessingUsageReport = {
  totalRub: number;
  runCount: number;
  photoCount: number;
};

const rubFormatter = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  maximumFractionDigits: 0,
});

const intFormatter = new Intl.NumberFormat("ru-RU");

const getDefaultDateRange = (): [Dayjs, Dayjs] => {
  const today = dayjs().startOf("day");
  return [today, today];
};

const StatisticsPage = () => {
  const { data: projectsData } = useGetProjects({
    axios: defaultApiAxiosParams,
  });
  const { data: user } = useProfile();
  const { hasPrivileges } = useShowPermissions();

  const hasAllowToAllProjects = hasPrivileges([
    UserRolesItem.admin,
    UserRolesItem.owner,
    UserRolesItem.agency,
    UserRolesItem.cluster,
  ]);

  const availableProjects = useMemo(() => {
    const projects = projectsData?.data.projects ?? [];
    if (hasAllowToAllProjects) return projects;
    return projects.filter((item) =>
      user?.workplace?.includes(item.id ?? "")
    );
  }, [projectsData, hasAllowToAllProjects, user?.workplace]);

  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>(getDefaultDateRange);

  useEffect(() => {
    if (!selectedProjectId && availableProjects.length > 0) {
      setSelectedProjectId(availableProjects[0].id ?? "");
    }
  }, [availableProjects, selectedProjectId]);

  const usageParams = useMemo(() => {
    if (!selectedProjectId) return undefined;
    return {
      projectId: selectedProjectId,
      from: `${formatUTCDate(dateRange[0])}T00:00:00.000Z`,
      to: `${formatUTCDate(dateRange[1])}T23:59:59.999Z`,
    };
  }, [selectedProjectId, dateRange]);

  const { data: usageResponse, isLoading } = useGetPhotosProcessingusage(
    usageParams,
    {
      axios: defaultApiAxiosParams,
      query: { enabled: !!usageParams },
    }
  );

  const report = usageResponse?.data as ProcessingUsageReport | undefined;

  const projectOptions = useMemo(
    () =>
      availableProjects.map((item) => ({
        label: item.name ?? "",
        value: item.id ?? "",
      })),
    [availableProjects]
  );

  const hasNoProjects = availableProjects.length === 0;

  const disableFutureDate = (current: Dayjs) =>
    !!current && current.isAfter(dayjs(), "day");

  return (
    <div className={css.container}>
      <div className={css.pageTitle}>Статистика</div>

      {hasNoProjects ? (
        <div className={css.emptyState}>Нет доступных филиалов</div>
      ) : (
        <div className={css.content}>
          <div className={css.filters}>
            <div className={css.selectWrapper}>
              <Select
                label="Филиал"
                placeholder="Выберите филиал"
                value={selectedProjectId || undefined}
                onChange={(val) => setSelectedProjectId(val ?? "")}
                options={projectOptions}
              />
            </div>
            <div className={css.dateRangeWrapper}>
              <div className={css.dateRangeLabel}>Период</div>
              <RangePicker
                className={css.rangePicker}
                value={dateRange}
                onChange={(values) => {
                  if (values?.[0] && values[1]) {
                    setDateRange([values[0], values[1]]);
                  }
                }}
                format="DD.MM.YYYY"
                allowClear={false}
                disabledDate={disableFutureDate}
              />
            </div>
          </div>

          <div className={css.card}>
            <div className={css.cardLabel}>Затраты на ИИ</div>
            {isLoading ? (
              <Skeleton.Input
                active
                size="large"
                style={{ width: 220, height: 40 }}
              />
            ) : (
              <div className={css.cardValue}>
                {rubFormatter.format(report?.totalRub ?? 0)}
              </div>
            )}
            <div className={css.cardHint}>
              Сумма всех запусков ИИ-обработки за выбранный период. Стоимость
              запуска фиксируется в долларах в момент обработки и пересчитывается
              в рубли по курсу продажи USD Т&#8209;Банка (обновляется раз в
              сутки). Итог округляется вверх до целого рубля.
            </div>
          </div>

          <div className={css.metricsGrid}>
            {[
              { label: "Запусков обработки", value: report?.runCount ?? 0 },
              { label: "Фотографий", value: report?.photoCount ?? 0 },
            ].map((item) => (
              <div key={item.label} className={css.metricCard}>
                <div className={css.cardLabel}>{item.label}</div>
                {isLoading ? (
                  <Skeleton.Input active size="small" style={{ width: 80 }} />
                ) : (
                  <div className={css.metricValue}>
                    {intFormatter.format(item.value)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatisticsPage;
