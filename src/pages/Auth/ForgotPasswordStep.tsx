import React, { useEffect, useRef, useState } from "react";
import Input from "../../components/Input/Input";
import Button from "../../components/Button/Button";
import { showNotification } from "../../components/ShowNotification";
import {
  usePostUsersForgotPassword,
  usePostUsersResetPassword,
} from "../../api/registerApi";
import css from "./index.module.css";

const RESEND_TIMEOUT_SEC = 60;

type Props = {
  /** Возврат на экран авторизации (вкладка «Вход»). */
  onDone: (message?: string) => void;
};

const ForgotPasswordStep: React.FC<Props> = ({ onDone }) => {
  // Внутренние шаги: ввод email → ввод кода и нового пароля.
  const [step, setStep] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resendIn, setResendIn] = useState(RESEND_TIMEOUT_SEC);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = () => {
    setResendIn(RESEND_TIMEOUT_SEC);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setResendIn((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const { mutate: forgotPassword, isLoading: isRequesting } =
    usePostUsersForgotPassword({
      onSuccess: () => {
        // Ответ всегда одинаковый (анти-энумерация) — просто переходим к вводу кода.
        setStep("reset");
        startTimer();
      },
      onError: (err) => {
        const message =
          (err as any)?.response?.data?.message ?? "Не удалось отправить код";
        showNotification({ type: "error", message });
      },
    });

  const { mutate: resetPassword, isLoading: isResetting } =
    usePostUsersResetPassword({
      onSuccess: () => {
        onDone("Пароль изменён. Войдите с новым паролем");
      },
      onError: (err) => {
        const message =
          (err as any)?.response?.data?.message ?? "Не удалось сбросить пароль";
        showNotification({ type: "error", message });
      },
    });

  const handleRequest = () => {
    if (!email) return;
    forgotPassword({ email });
  };

  const handleResend = () => {
    if (resendIn > 0 || !email) return;
    forgotPassword({ email });
  };

  const handleReset = () => {
    if (code.length !== 6 || newPassword.length < 6) return;
    resetPassword({ email, code, newPassword });
  };

  if (step === "request") {
    return (
      <div className={css.form}>
        <div className={css.verifyHint}>
          Укажите email вашей учётной записи — отправим 6-значный код для сброса
          пароля.
        </div>
        <Input
          label="E-mail"
          type="email"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isRequesting}
          placeholder="Введите E-mail"
        />
        <Button
          disabled={!email || isRequesting}
          onClick={handleRequest}
          showSpinner={isRequesting}
        >
          Отправить код
        </Button>
        <div className={css.resendRow}>
          <Button type="link" onClick={() => onDone()} disabled={isRequesting}>
            Вернуться ко входу
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={css.form}>
      <div className={css.verifyHint}>
        Отправили 6-значный код на <b>{email}</b>. Введите его и задайте новый
        пароль.
      </div>
      <Input
        label="Код подтверждения"
        inputMode="numeric"
        maxLength={6}
        autoFocus
        value={code}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
          setCode(digits);
        }}
        disabled={isResetting}
        placeholder="••••••"
      />
      <Input
        label="Новый пароль"
        isPasswordInput
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        disabled={isResetting}
        placeholder="Минимум 6 символов"
      />
      <Button
        disabled={code.length !== 6 || newPassword.length < 6 || isResetting}
        onClick={handleReset}
        showSpinner={isResetting}
      >
        Сменить пароль
      </Button>
      <div className={css.resendRow}>
        <Button
          type="link"
          disabled={resendIn > 0 || isRequesting}
          onClick={handleResend}
          showSpinner={isRequesting}
        >
          {resendIn > 0
            ? `Отправить код повторно (${resendIn} сек)`
            : "Отправить код повторно"}
        </Button>
        <Button type="link" onClick={() => onDone()} disabled={isResetting}>
          Вернуться ко входу
        </Button>
      </div>
    </div>
  );
};

export default ForgotPasswordStep;
