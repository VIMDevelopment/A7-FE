import { format } from "date-fns";
import dayjs, { Dayjs, extend } from "dayjs";
import CustomParseFormat from "dayjs/plugin/customParseFormat";

extend(CustomParseFormat);

type DateOrEmpty = Date | string | null | undefined;

export const getDate = (v: Date | string) => dayjs(v);

const validDate = (formatter: (v: Date | string) => string) => (value: DateOrEmpty) =>
  value == null || value === "" || new Date(value).toString() === "Invalid Date" ? "" : formatter(value);

export const parseDate = (v: string, prevDate?: string | null) => {
  const parseDate = v.split(".");
  const date = new Date(`${parseDate[1]}/${parseDate[0]}/${parseDate[2]}`);

  return date.toString() !== "Invalid Date" ? date : prevDate;
};

export const isBefore = (firstDate: DateOrEmpty, secondDate: DateOrEmpty) =>
  getDate(firstDate ?? "").isBefore(getDate(secondDate ?? ""));

export const formatDate = validDate((v) => format(new Date(v), `dd.MM.yy`));

export const formatTime = validDate((v) => format(new Date(v), `HH:mm`));

export const formatDateWithMinutes = validDate((v) => format(new Date(v), `dd.MM.yyyy HH:mm`));

export const formatDateWithSeconds = validDate((v) => format(new Date(v), `dd.MM.yyyy HH:mm:ss`));

export const formatUTCDate = (value: string | Date | Dayjs): string => dayjs(value).format("YYYY-MM-DD");

export const StrToDate = (str: string) => {
  return dayjs(str, "DD.MM.YYYY");
};

export const StrToTime = (str: string) => {
  return StrToDate(str).valueOf();
};
