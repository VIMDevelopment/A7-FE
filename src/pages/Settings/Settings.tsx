import React, { useState } from "react";
import css from "./index.module.css";
import { PutApiUsersIdBody, UserRole } from "../../api/a7-service/model";
import { usePutApiUsersId } from "../../api/a7-service";
import { defaultApiAxiosParams } from "../../api/helpers";
import { useProfile } from "../../auth/auth";
import { LoadingOutlined } from "@ant-design/icons";
import { Option } from "antd/es/mentions";
import Input from "../../components/Input/Input";
import Button from "../../components/Button/Button";
import Select from "../../components/Select/Select";
import { getRoleDescription } from "../../components/SideMenu/helpers";

const SettingsPage = () => {
  const { data: user } = useProfile();
  const [formState, setFormState] = useState<PutApiUsersIdBody>();

  const {
    data,
    isLoading,
    isError,
    error,
    mutate: updale,
  } = usePutApiUsersId({
    axios: defaultApiAxiosParams,
  });

  console.log(formState)

  const handleLoginClick = () => {
    updale({
      id: user?.id ?? "",
      data: formState ?? {},
    });
  };

  // useEffect(() => {
  //   if (data) {
  //     Cookies.set("accessToken", data?.data?.user?.accessToken ?? "", {});
  //     window.location.replace(PublicRoutes.MAIN.static);
  //   }
  // }, [data]);

  return (
    <div className={css.container}>
      <div className={css.pageTitle}>Настройки</div>
      <div className={css.form}>
        <Input
          label="Имя пользователя"
          onChange={(e) =>
            setFormState((prev) => ({
              ...prev,
              username: e.target.value,
            }))
          }
          disabled={isLoading}
          placeholder="Имя"
        />
        <Input
          label="E-mail"
          onChange={(e) =>
            setFormState((prev) => ({
              ...prev,
              email: e.target.value,
            }))
          }
          disabled={isLoading}
          placeholder="Введите E-mail"
          type="email"
        />
        <Select
          label="Роль"
          onChange={(value) =>
            setFormState((prev) => ({
              ...prev,
              role: value,
            }))
          }
          options={[
            {
              key: UserRole.photographer,
              value: UserRole.photographer,
              label: getRoleDescription(UserRole.photographer),
            },
            {
              key: UserRole.seller,
              value: UserRole.seller,
              label: getRoleDescription(UserRole.seller),
            },
            {
              key: UserRole.manager,
              value: UserRole.manager,
              label: getRoleDescription(UserRole.manager),
            },
          ]}
        />
        {isError && (
          <>
            {/* @ts-ignore */}
            <div className={css.error}>{error?.response?.data?.message}</div>
          </>
        )}
        <Button
          className={css.btn}
          disabled={isLoading || !formState}
          onClick={handleLoginClick}
          showSpinner={isLoading}
        >
          Сохранить
        </Button>
      </div>
    </div>
  );
};
export default SettingsPage;
