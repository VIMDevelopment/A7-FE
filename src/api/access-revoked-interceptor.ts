import axios from "axios";
import Cookies from "js-cookie";
import { PublicRoutes } from "../routes/routes";

type ErrorLike = { response?: { status?: number; data?: { code?: string } } };

export function isAccessRevoked(error: unknown): boolean {
  const response = (error as ErrorLike)?.response;
  return response?.status === 401 && response.data?.code === "ACCESS_REVOKED";
}

export function handleAccessRevoked(error: unknown, logout: () => void): Promise<never> {
  if (isAccessRevoked(error)) logout();
  return Promise.reject(error);
}

let installed = false;

export function installAccessRevokedInterceptor(): void {
  if (installed) return;
  installed = true;
  axios.interceptors.response.use(undefined, (error) =>
    handleAccessRevoked(error, () => {
      Cookies.remove("accessToken");
      window.location.replace(PublicRoutes.LOGIN.static);
    })
  );
}
