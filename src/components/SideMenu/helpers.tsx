import { BankOutlined } from "@ant-design/icons";
import { UserRole } from "../../api/a7-service/model";
import ProjectsIcon from "../../assets/ProjectsIcon";
import ReportsIcon from "../../assets/ReportsIcon";
import SettingsIcon from "../../assets/SettingsIcon";
import StatisticsIcon from "../../assets/StatisticsIcon";
import { PublicRoutes } from "../../routes/routes";
import { SideMenuItemProps } from "./components/SideMenuItem/SideMenuItem";

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

export const menuItems: SideMenuItemProps[] = [
  {
    icon: <ProjectsIcon />,
    title: "Проекты",
    route: PublicRoutes.PROJECTS.static,
  },
  {
    icon: <ReportsIcon />,
    title: "Отчеты",
    route: PublicRoutes.REPORTS.static,
  },
  {
    icon: <StatisticsIcon />,
    title: "Статистика",
    route: PublicRoutes.STATISTICS.static,
  },
  {
    icon: <SettingsIcon />,
    title: "Настройки профиля",
    route: PublicRoutes.SETTINGS.static,
  },
  {
    icon: (
      <BankOutlined
        style={{
          color: "rgba(255, 255, 255, 0.5)",
          fontSize: "28px",
          paddingBottom: "2px",
        }}
      />
    ),
    title: "Администрирование",
    route: PublicRoutes.ADMINISTRATION.static,
  },
];
