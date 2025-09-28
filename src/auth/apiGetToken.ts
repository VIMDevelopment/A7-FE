import Cookies from "js-cookie";

export const apiGetToken = () => Cookies.get("accessToken");
