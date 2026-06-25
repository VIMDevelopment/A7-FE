import React, { useState } from "react";
import { Tabs } from "antd";
import css from "./index.module.css";
import LoginTab from "./LoginTab";
import RegisterTab from "./RegisterTab";
import VerifyEmailStep from "./VerifyEmailStep";
import ForgotPasswordStep from "./ForgotPasswordStep";
import { showNotification } from "../../components/ShowNotification";

type TabKey = "login" | "register";

const AuthPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("login");
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [pendingVerification, setPendingVerification] = useState<{
    email: string;
    name: string;
  } | null>(null);

  const title = pendingVerification
    ? "Подтверждение email"
    : isForgotPassword
    ? "Восстановление пароля"
    : "Авторизация";

  const handleForgotDone = (message?: string) => {
    setIsForgotPassword(false);
    setActiveTab("login");
    if (message) showNotification({ type: "success", message });
  };

  return (
    <div className={css.container}>
      <div className={css.modal}>
        <div className={css.title}>{title}</div>
        {pendingVerification ? (
          <VerifyEmailStep
            email={pendingVerification.email}
            applicantName={pendingVerification.name}
            onBack={() => setPendingVerification(null)}
          />
        ) : isForgotPassword ? (
          <ForgotPasswordStep onDone={handleForgotDone} />
        ) : (
          <Tabs
            className={css.tabs}
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key as TabKey)}
            items={[
              {
                key: "login",
                label: "Вход",
                children: (
                  <LoginTab
                    isActive={activeTab === "login"}
                    onForgotPassword={() => setIsForgotPassword(true)}
                  />
                ),
              },
              {
                key: "register",
                label: "Регистрация",
                children: (
                  <RegisterTab
                    isActive={activeTab === "register"}
                    onRegistered={(email, name) =>
                      setPendingVerification({ email, name })
                    }
                  />
                ),
              },
            ]}
          />
        )}
      </div>
    </div>
  );
};

export default AuthPage;
