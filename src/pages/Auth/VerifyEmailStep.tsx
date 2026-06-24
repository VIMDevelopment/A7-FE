import React, { useEffect, useRef, useState } from "react";
import Cookies from "js-cookie";
import Input from "../../components/Input/Input";
import Button from "../../components/Button/Button";
import { showNotification } from "../../components/ShowNotification";
import {
  usePostUsersResendCode,
  usePostUsersVerifyEmail,
} from "../../api/registerApi";
import { PublicRoutes } from "../../routes/routes";
import css from "./index.module.css";

const RESEND_TIMEOUT_SEC = 60;

type Props = {
  email: string;
  applicantName: string;
  onBack: () => void;
};

const VerifyEmailStep: React.FC<Props> = ({ email, applicantName, onBack }) => {
  const [code, setCode] = useState("");
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
    startTimer();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const { mutate: verifyEmail, isLoading: isVerifying } = usePostUsersVerifyEmail(
    {
      onSuccess: ({ data }) => {
        Cookies.set("accessToken", data.jwt ?? "", {});
        window.location.replace(PublicRoutes.PROJECTS.static);
      },
      onError: (err) => {
        const message =
          (err as any)?.response?.data?.message ?? "Не удалось подтвердить код";
        showNotification({ type: "error", message });
      },
    }
  );

  const { mutate: resendCode, isLoading: isResending } = usePostUsersResendCode({
    onSuccess: () => {
      showNotification({ type: "success", message: "Код отправлен повторно" });
      startTimer();
    },
    onError: (err) => {
      const message =
        (err as any)?.response?.data?.message ?? "Не удалось отправить код";
      showNotification({ type: "error", message });
    },
  });

  const handleVerify = () => {
    if (code.length !== 6) return;
    verifyEmail({ email, code });
  };

  const handleResend = () => {
    if (resendIn > 0) return;
    resendCode({ email });
  };

  return (
    <div className={css.form}>
      <div className={css.verifyHint}>
        Отправили 6-значный код на <b>{email}</b>{applicantName ? <>, {applicantName}</> : null}.
        Введите код ниже.
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
        disabled={isVerifying}
        placeholder="••••••"
      />
      <Button
        disabled={code.length !== 6 || isVerifying}
        onClick={handleVerify}
        showSpinner={isVerifying}
      >
        Подтвердить
      </Button>
      <div className={css.resendRow}>
        <Button
          type="link"
          disabled={resendIn > 0 || isResending}
          onClick={handleResend}
          showSpinner={isResending}
        >
          {resendIn > 0
            ? `Отправить код повторно (${resendIn} сек)`
            : "Отправить код повторно"}
        </Button>
        <Button type="link" onClick={onBack} disabled={isVerifying}>
          Изменить данные
        </Button>
      </div>
    </div>
  );
};

export default VerifyEmailStep;
