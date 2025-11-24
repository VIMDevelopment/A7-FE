import { BankOutlined, LogoutOutlined } from "@ant-design/icons";
import ProjectsIcon from "../../assets/ProjectsIcon";
import SettingsIcon from "../../assets/SettingsIcon";
import { PublicRoutes } from "../../routes/routes";
import { SideMenuItemProps } from "./components/SideMenuItem/SideMenuItem";
import { UserRole } from "../../apiV2/a7-service/model";

export const getRoleDescription = (role?: UserRole) => {
  switch (role) {
    case UserRole.admin:
      return "Администратор";

    case UserRole.owner:
      return "Владелец";

    case UserRole.cluster:
      return "Cluster";

    case UserRole.agency:
      return "Agency";

    case UserRole.supervisor:
      return "Супервизор";

    case UserRole.maker:
      return "Мэйкер";

    default:
      return "";
  }
};

export const getMenuItems: ({
  isMobileMenu,
  onLogout,
}: {
  isMobileMenu: boolean;
  onLogout: () => void;
}) => SideMenuItemProps[] = ({ isMobileMenu, onLogout }) => [
  {
    icon: <ProjectsIcon />,
    title: "Проекты",
    route: PublicRoutes.PROJECTS.static,
  },
  // {
  //   icon: <ReportsIcon />,
  //   title: "Отчеты",
  //   route: PublicRoutes.REPORTS.static,
  // },
  // {
  //   icon: <StatisticsIcon />,
  //   title: "Статистика",
  //   route: PublicRoutes.STATISTICS.static,
  // },
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
  ...(isMobileMenu
    ? [
        {
          icon: (
            <LogoutOutlined
              style={{
                color: "rgba(255, 255, 255, 0.5)",
                fontSize: "28px",
                paddingBottom: "2px",
              }}
            />
          ),
          title: "Выйти",
          route: PublicRoutes.PROJECTS.static,
          customOnClick: onLogout,
        },
      ]
    : []),
];
