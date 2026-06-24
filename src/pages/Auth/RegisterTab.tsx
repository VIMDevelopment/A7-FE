import React, { useEffect, useState } from "react";
import Input from "../../components/Input/Input";
import Button from "../../components/Button/Button";
import Select from "../../components/Select/Select";
import { showNotification } from "../../components/ShowNotification";
import {
  useGetSupervisorsPublic,
  usePostUsersRegisterPublic,
} from "../../api/registerApi";
import { formatFullNameForApi } from "../../lib/utils/fullName";
import css from "./index.module.css";

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  repeatPassword: string;
  supervisorId?: string;
};

const initialState: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  repeatPassword: "",
  supervisorId: undefined,
};

type Props = {
  isActive: boolean;
  onRegistered: (email: string, name: string) => void;
};

const RegisterTab: React.FC<Props> = ({ isActive, onRegistered }) => {
  const [formState, setFormState] = useState<FormState>(initialState);
  const [isPasswordError, setIsPasswordError] = useState(false);

  const { data: supervisorsData, isLoading: isSupervisorsLoading } =
    useGetSupervisorsPublic({ enabled: isActive });

  const { mutate: registerPublic, isLoading } = usePostUsersRegisterPublic({
    onSuccess: () => {
      const fullName = formatFullNameForApi(
        formState.lastName,
        formState.firstName
      );
      onRegistered(formState.email.trim().toLowerCase(), fullName);
    },
    onError: (err) => {
      const message =
        (err as any)?.response?.data?.message ??
        "Не удалось зарегистрироваться";
      showNotification({ type: "error", message });
    },
  });

  useEffect(() => {
    if (!isActive) {
      setIsPasswordError(false);
    }
  }, [isActive]);

  const handleSubmit = () => {
    if (formState.password !== formState.repeatPassword) {
      setIsPasswordError(true);
      showNotification({
        type: "error",
        message: "Пароли не совпадают",
        description: "Введите одинаковые пароли в оба поля",
      });
      return;
    }
    if (!formState.supervisorId) {
      showNotification({
        type: "error",
        message: "Выберите руководителя филиала",
      });
      return;
    }
    setIsPasswordError(false);
    registerPublic({
      firstName: formState.firstName.trim(),
      lastName: formState.lastName.trim(),
      email: formState.email.trim().toLowerCase(),
      password: formState.password,
      supervisorId: formState.supervisorId,
    });
  };

  const supervisorOptions = (supervisorsData?.data ?? []).map((s) => ({
    key: s.id,
    value: s.id,
    label: s.name,
  }));

  const isSubmitDisabled =
    isLoading ||
    !formState.firstName.trim() ||
    !formState.lastName.trim() ||
    !formState.email.trim() ||
    formState.password.length < 6 ||
    !formState.repeatPassword ||
    !formState.supervisorId;

  return (
    <div className={css.form}>
      <Input
        label="Имя"
        onChange={(e) =>
          setFormState((p) => ({ ...p, firstName: e.target.value }))
        }
        value={formState.firstName}
        disabled={isLoading}
        placeholder="Введите имя"
      />
      <Input
        label="Фамилия"
        onChange={(e) =>
          setFormState((p) => ({ ...p, lastName: e.target.value }))
        }
        value={formState.lastName}
        disabled={isLoading}
        placeholder="Введите фамилию"
      />
      <Input
        label="E-mail"
        type="email"
        onChange={(e) =>
          setFormState((p) => ({ ...p, email: e.target.value }))
        }
        value={formState.email}
        disabled={isLoading}
        placeholder="Введите E-mail"
      />
      <Input
        label="Пароль"
        isPasswordInput
        onChange={(e) => {
          setFormState((p) => ({ ...p, password: e.target.value }));
          setIsPasswordError(false);
        }}
        value={formState.password}
        disabled={isLoading}
        placeholder="Минимум 6 символов"
        status={isPasswordError ? "error" : ""}
      />
      <Input
        label="Подтвердите пароль"
        isPasswordInput
        onChange={(e) => {
          setFormState((p) => ({ ...p, repeatPassword: e.target.value }));
          setIsPasswordError(false);
        }}
        value={formState.repeatPassword}
        disabled={isLoading}
        placeholder="Повторно введите пароль"
        status={isPasswordError ? "error" : ""}
      />
      <Select
        label="Руководитель филиала"
        searchable
        placeholder={
          isSupervisorsLoading ? "Загрузка..." : "Выберите из списка"
        }
        loading={isSupervisorsLoading}
        disabled={isLoading || isSupervisorsLoading}
        value={formState.supervisorId}
        onChange={(value) =>
          setFormState((p) => ({ ...p, supervisorId: value as string }))
        }
        options={supervisorOptions}
      />
      <Button
        disabled={isSubmitDisabled}
        onClick={handleSubmit}
        showSpinner={isLoading}
      >
        Зарегистрироваться
      </Button>
    </div>
  );
};

export default RegisterTab;
