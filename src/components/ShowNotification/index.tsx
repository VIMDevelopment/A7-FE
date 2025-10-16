import { notification } from "antd";

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
  });
};
