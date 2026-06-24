import React, { useState } from "react";
import { Tabs } from "antd";
import css from "./index.module.css";
import LoginTab from "./LoginTab";
import RegisterTab from "./RegisterTab";
import VerifyEmailStep from "./VerifyEmailStep";

type TabKey = "login" | "register";

const AuthPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("login");
  const [pendingVerification, setPendingVerification] = useState<{
    email: string;
    name: string;
  } | null>(null);

  return (
    <div className={css.container}>
      <div className={css.modal}>
        <div className={css.title}>
          {pendingVerification ? "Подтверждение email" : "Авторизация"}
        </div>
        {pendingVerification ? (
          <VerifyEmailStep
            email={pendingVerification.email}
            applicantName={pendingVerification.name}
            onBack={() => setPendingVerification(null)}
          />
        ) : (
          <Tabs
            className={css.tabs}
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key as TabKey)}
            items={[
              {
                key: "login",
                label: "Вход",
                children: <LoginTab isActive={activeTab === "login"} />,
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
