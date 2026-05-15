import {
  BankOutlined,
  BarChartOutlined,
  BookOutlined,
  EyeOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import ProjectsIcon from "../../assets/ProjectsIcon";
import SettingsIcon from "../../assets/SettingsIcon";
import { PublicRoutes } from "../../routes/routes";
import { SideMenuItemProps } from "./components/SideMenuItem/SideMenuItem";
import { UserRolesItem } from "../../apiV2/a7-service/model";

export const getRoleDescription = (role?: UserRolesItem) => {
  switch (role) {
    case UserRolesItem.admin:
      return "Суперадмин";

    case UserRolesItem.owner:
      return "Владелец";

    case UserRolesItem.agency:
      return "Директор";

    case UserRolesItem.cluster:
      return "Региональный руководитель";

    case UserRolesItem.supervisor:
      return "Руководитель филиала";

    case UserRolesItem.maker:
      return "Мейкер";

    case UserRolesItem.prompt:
      return "Промпт-инженер";

    case UserRolesItem.remote:
      return "Удалённый сотрудник";

    default:
      return "";
  }
};

const iconStyle = { fontSize: "20px" };

export const getMenuItems: () => SideMenuItemProps[] = () => [
  {
    icon: <ProjectsIcon />,
    title: "Файлы",
    route: PublicRoutes.PROJECTS.static,
  },
  {
    icon: <EyeOutlined style={iconStyle} />,
    title: "Распознавание",
    route: PublicRoutes.RECOGNITION.static,
  },
  {
    icon: <SettingsIcon />,
    title: "Настройки профиля",
    route: PublicRoutes.SETTINGS.static,
  },
  {
    icon: <FileTextOutlined style={iconStyle} />,
    title: "Промпты",
    route: PublicRoutes.PROMPTS.static,
  },
  {
    icon: <BarChartOutlined style={iconStyle} />,
    title: "Статистика",
    route: PublicRoutes.STATISTICS.static,
  },
  {
    icon: <BookOutlined style={iconStyle} />,
    title: "База знаний",
    route: PublicRoutes.KNOWLEDGE_BASE.static,
  },
  {
    icon: <BankOutlined style={iconStyle} />,
    title: "Администрирование",
    route: PublicRoutes.ADMINISTRATION.static,
  },
];
