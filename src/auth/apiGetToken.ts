import Cookies from "js-cookie"

export const apiGetToken = () => {
  const accessToken = Cookies.get("accessToken")
  
  console.log('accessToken ===>', accessToken)

  return accessToken
}
