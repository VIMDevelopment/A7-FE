import {
  BankOutlined,
  EyeOutlined,
  CloudOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import ProjectsIcon from "../../assets/ProjectsIcon";
import SettingsIcon from "../../assets/SettingsIcon";
import { PublicRoutes } from "../../routes/routes";
import { SideMenuItemProps } from "./components/SideMenuItem/SideMenuItem";
import { UserRole } from "../../apiV2/a7-service/model";

export const getRoleDescription = (role?: UserRole) => {
  switch (role) {
    case UserRole.admin:
      return "Суперадмин";

    case UserRole.owner:
      return "Владелец";

    case UserRole.agency:
      return "Директор";

    case UserRole.cluster:
      return "Региональный руководитель";

    case UserRole.supervisor:
      return "Руководитель филиала";

    case UserRole.maker:
      return "Мейкер";

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
    icon: <CloudOutlined style={iconStyle} />,
    title: "Диск",
    route: PublicRoutes.DISK.static,
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
    icon: <BankOutlined style={iconStyle} />,
    title: "Администрирование",
    route: PublicRoutes.ADMINISTRATION.static,
  },
];
