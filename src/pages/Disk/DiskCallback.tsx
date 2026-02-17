import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { exchangeCodeForToken } from "../../services/yandexDisk/api";
import { PublicRoutes } from "../../routes/routes";
import { showNotification } from "../../components/ShowNotification";
import css from "./index.module.css";

const DiskCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      setStatus("error");
      showNotification({
        type: "error",
        message: "Ошибка авторизации",
        description: searchParams.get("error_description") || "Не удалось авторизоваться в Яндекс Диске",
      });
      setTimeout(() => {
        navigate(PublicRoutes.DISK.static);
      }, 2000);
      return;
    }

    if (!code) {
      setStatus("error");
      showNotification({
        type: "error",
        message: "Код авторизации не получен",
      });
      setTimeout(() => {
        navigate(PublicRoutes.DISK.static);
      }, 2000);
      return;
    }

    const handleAuth = async () => {
      try {
        await exchangeCodeForToken(code);
        setStatus("success");
        showNotification({
          type: "success",
          message: "Яндекс Диск успешно подключен",
        });
        setTimeout(() => {
          navigate(PublicRoutes.DISK.static);
        }, 1500);
      } catch (err) {
        setStatus("error");
        showNotification({
          type: "error",
          message: "Ошибка при получении токена",
          description: err instanceof Error ? err.message : "Неизвестная ошибка",
        });
        setTimeout(() => {
          navigate(PublicRoutes.DISK.static);
        }, 2000);
      }
    };

    void handleAuth();
  }, [searchParams, navigate]);

  return (
    <div className={css.container}>
      <div className={css.pageTitle}>Подключение Яндекс Диска</div>
      <div className={css.callbackStatus}>
        {status === "loading" && <div>Обработка авторизации...</div>}
        {status === "success" && <div>Успешно! Перенаправление...</div>}
        {status === "error" && <div>Ошибка. Перенаправление...</div>}
      </div>
    </div>
  );
};

export default DiskCallbackPage;





