import { ENV } from "../env";
import { stringify } from "qs";

export const defaultApiAxiosParams = {
  baseURL: ENV.REACT_APP_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  paramsSerializer: (params: any) =>
    stringify(params, { arrayFormat: "repeat" }),
};
