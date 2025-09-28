import { notification } from "antd";
import css from "./index.module.css";

type NotificationType = "error" | "success" | "info";

type Notification = {
  message: string;
  description?: string;
  type?: NotificationType;
};

export const showNotification = (notificationObject: Notification) => {
  const { message, description = "", type = "success" } = notificationObject;

  return notification[type]({
    message,
    description,
    className: css.notificationStyle,
  });
};
