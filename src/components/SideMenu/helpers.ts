import { UserRole } from "../../api/a7-service/model";

export const getRoleDescription = (role?: UserRole) => {
  switch (role) {
    case UserRole.admin:
      return "Администратор";

    case UserRole.manager:
      return "Менеджер";

    case UserRole.photographer:
      return "Фотограф";

    case UserRole.seller:
      return "Продавец";

    default:
      return "";
  }
};
