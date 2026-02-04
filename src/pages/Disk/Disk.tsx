import React, { useEffect, useState } from "react";
import css from "./index.module.css";
import {
  getYandexDiskAuthUrl,
  isYandexDiskAuthorized,
  disconnectYandexDisk,
  getYandexDiskUserInfo,
  exchangeCodeForToken,
} from "../../services/yandexDisk/api";
import Button from "../../components/Button/Button";
import Modal from "../../components/Modal/Modal";
import Input from "../../components/Input/Input";
import { showNotification } from "../../components/ShowNotification";
import { CheckCircleOutlined, DisconnectOutlined } from "@ant-design/icons";

const DiskPage = () => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<{ login?: string; display_name?: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [authCode, setAuthCode] = useState("");

  useEffect(() => {
    checkAuthorization();
  }, []);

  const checkAuthorization = async () => {
    const authorized = isYandexDiskAuthorized();
    setIsAuthorized(authorized);

    if (authorized) {
      try {
        const info = await getYandexDiskUserInfo();
        setUserInfo(info);
      } catch (error) {
        // Если токен невалидный, отключаем
        disconnectYandexDisk();
        setIsAuthorized(false);
        setUserInfo(null);
      }
    }
  };

  const handleConnect = () => {
    const authUrl = getYandexDiskAuthUrl();
    if (!authUrl || !authUrl.includes("client_id")) {
      showNotification({
        type: "error",
        message: "Ошибка конфигурации",
        description: "Не настроен Client ID для Яндекс Диска. Обратитесь к администратору.",
      });
      return;
    }
    setIsModalOpen(true);
  };

  const handleAuth = async () => {
    if (!authCode.trim()) {
      showNotification({
        type: "error",
        message: "Введите код авторизации",
      });
      return;
    }

    setIsLoading(true);
    try {
      await exchangeCodeForToken(authCode.trim());
      setIsAuthorized(true);
      setIsModalOpen(false);
      setAuthCode("");
      await checkAuthorization();
      showNotification({
        type: "success",
        message: "Яндекс Диск успешно подключен",
      });
    } catch (err) {
      showNotification({
        type: "error",
        message: "Ошибка при получении токена",
        description: err instanceof Error ? err.message : "Неизвестная ошибка",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    disconnectYandexDisk();
    setIsAuthorized(false);
    setUserInfo(null);
    showNotification({
      type: "success",
      message: "Яндекс Диск отключен",
    });
  };

  const handleOpenAuthPage = () => {
    const authUrl = getYandexDiskAuthUrl();
    if (authUrl && authUrl.includes("client_id")) {
      window.open(authUrl, "_blank");
    }
  };

  return (
    <div className={css.container}>
      <div className={css.pageTitle}>Диск</div>

      <div className={css.authSection}>
        {!isAuthorized ? (
          <div className={css.authBlock}>
            <div className={css.authDescription}>
              Подключите свой Яндекс Диск для синхронизации файлов
            </div>
            <Button onClick={handleConnect} disabled={isLoading}>
              Подключить Яндекс Диск
            </Button>
          </div>
        ) : (
          <div className={css.authBlock}>
            <div className={css.connectedStatus}>
              <CheckCircleOutlined style={{ color: "#52c41a", marginRight: "8px" }} />
              <span>Яндекс Диск подключен</span>
              {userInfo && (
                <div className={css.userInfo}>
                  {userInfo.display_name || userInfo.login}
                </div>
              )}
            </div>
            <Button
              onClick={handleDisconnect}
              disabled={isLoading}
              icon={<DisconnectOutlined />}
            >
              Отключить
            </Button>
          </div>
        )}
      </div>

      <Modal
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setAuthCode("");
        }}
        onOk={handleAuth}
        okButtonName="Подключить"
        cancelButtonName="Отмена"
        isLoading={isLoading}
        title="Подключение Яндекс Диска"
      >
        <div className={css.modalContent}>
          <div className={css.modalDescription}>
            <p>1. Нажмите на кнопку ниже, чтобы открыть страницу авторизации Яндекс</p>
            <p>2. Разрешите доступ приложению</p>
            <p>3. Скопируйте код авторизации из адресной строки (параметр <code>code=</code>)</p>
            <p>4. Вставьте код в поле ниже и нажмите "Подключить"</p>
          </div>
          <Button
            onClick={handleOpenAuthPage}
            variant={"solid"}
          >
            Открыть страницу авторизации Яндекс
          </Button>
          <Input
            label="Код авторизации"
            placeholder="Вставьте код авторизации"
            value={authCode}
            onChange={(e) => setAuthCode(e.target.value)}
            disabled={isLoading}
          />
        </div>
      </Modal>
    </div>
  );
};

export default DiskPage;
