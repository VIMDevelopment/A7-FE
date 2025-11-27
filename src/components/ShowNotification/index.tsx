import { notification } from "antd";
import css from "./index.module.css";

type NotificationType = "error" | "success" | "info";

type Notification = {
  message: string;
  description?: string;
  type?: NotificationType;
  duration?: number;
};

export const showNotification = (notificationObject: Notification) => {
  const {
    message,
    description = "",
    type = "success",
    duration,
  } = notificationObject;

  return notification[type]({
    className: css.notification,
    message,
    description,
    duration,
  });
};
