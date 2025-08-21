import { apiGetToken } from "../auth/apiGetToken";
import { ENV } from "../env";
import { stringify } from "qs";

export const defaultApiAxiosParams = {
  baseURL: ENV.REACT_APP_API_URL,
  headers: {
    "Content-Type": "application/json",
    Authorization: apiGetToken() ? `Bearer ${apiGetToken()}` : "",
  },
  paramsSerializer: (params: any) =>
    stringify(params, { arrayFormat: "repeat" }),
};
