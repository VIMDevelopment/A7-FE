/**
 * [R-42] Итог «Затраты на ИИ»: рубли по курсу; если курс USD/RUB не задан — доллары и
 * пометка (раньше отчёт падал, а экран показывал «0 ₽», будто затрат нет).
 */
export type CostTotalReport = {
  totalRub: number | null;
  totalUsd?: number;
  rateMissing?: boolean;
};

const rubFormatter = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  maximumFractionDigits: 0,
});

export function describeCostTotal(report: CostTotalReport | undefined): { value: string; warning?: string } {
  if (report?.rateMissing) {
    return {
      value: `$${(report.totalUsd ?? 0).toFixed(2)}`,
      warning: "Курс USD/RUB не задан — сумма показана в долларах. Рубли появятся, когда курс обновится.",
    };
  }
  return { value: rubFormatter.format(report?.totalRub ?? 0) };
}
