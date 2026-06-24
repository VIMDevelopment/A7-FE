import React, { useMemo, useState } from "react";
import { useQueryClient } from "react-query";
import { format } from "date-fns";
import {
  GET_USERS_PENDING_KEY,
  PendingUserDto,
  useGetUsersPending,
  usePatchUsersGrantAccess,
} from "../../api/registerApi";
import { useGetProjects } from "../../apiV2/a7-service";
import { defaultApiAxiosParams } from "../../api/helpers";
import { UserRolesItem } from "../../apiV2/a7-service/model";
import { useProfile } from "../../auth/auth";
import { showNotification } from "../../components/ShowNotification";
import Button from "../../components/Button/Button";
import Select from "../../components/Select/Select";
import Modal from "../../components/Modal/Modal";
import { getRolesOptions, getWorkplaceOptions } from "./helpers";
import css from "./index.module.css";

type GrantFormState = {
  roles: UserRolesItem[];
  workplace: string[];
};

const PendingUsersTab: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: currentUser } = useProfile();
  const [supervisorFilter, setSupervisorFilter] = useState<string | undefined>();
  const [selectedPending, setSelectedPending] = useState<PendingUserDto | null>(null);
  const [grantForm, setGrantForm] = useState<GrantFormState>({
    roles: [],
    workplace: [],
  });

  const { data: pendingData, isLoading: isPendingLoading } = useGetUsersPending();
  const { data: projectsData, isLoading: isProjectsLoading } = useGetProjects({
    axios: defaultApiAxiosParams,
  });

  const isSupervisor = (currentUser?.roles ?? []).includes(
    UserRolesItem.supervisor
  );
  const isHighRole = (currentUser?.roles ?? []).some((r) =>
    [
      UserRolesItem.admin,
      UserRolesItem.owner,
      UserRolesItem.agency,
      UserRolesItem.cluster,
    ].includes(r)
  );

  const supervisorOptions = useMemo(() => {
    const map = new Map<string, string>();
    (pendingData?.data ?? []).forEach((p) => {
      if (p.requestedSupervisor) {
        map.set(p.requestedSupervisor.id, p.requestedSupervisor.name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({
      key: id,
      value: id,
      label: name,
    }));
  }, [pendingData]);

  const filteredPending = useMemo(() => {
    const list = pendingData?.data ?? [];
    if (!supervisorFilter) return list;
    return list.filter(
      (p) => p.requestedSupervisor?.id === supervisorFilter
    );
  }, [pendingData, supervisorFilter]);

  const { mutate: grantAccess, isLoading: isGranting } =
    usePatchUsersGrantAccess({
      onSuccess: () => {
        showNotification({
          type: "success",
          message: "Доступ выдан",
        });
        void queryClient.invalidateQueries({ queryKey: GET_USERS_PENDING_KEY });
        void queryClient.invalidateQueries({ queryKey: `/users/all` });
        setSelectedPending(null);
      },
      onError: (err) => {
        const message =
          (err as any)?.response?.data?.message ??
          "Не удалось выдать доступ";
        showNotification({ type: "error", message });
      },
    });

  const openGrantModal = (user: PendingUserDto) => {
    const defaultWorkplace = isSupervisor
      ? currentUser?.workplace ?? []
      : [];
    setSelectedPending(user);
    setGrantForm({
      roles: [UserRolesItem.maker],
      workplace: defaultWorkplace,
    });
  };

  const handleGrantSubmit = () => {
    if (!selectedPending) return;
    if (grantForm.roles.length === 0) {
      showNotification({ type: "error", message: "Выберите хотя бы одну роль" });
      return;
    }
    grantAccess({
      id: selectedPending.id,
      data: {
        roles: grantForm.roles,
        workplace: grantForm.workplace,
      },
    });
  };

  return (
    <div className={css.section}>
      <div className={css.sectionTitle}>Ожидают выдачи доступа</div>

      {isHighRole && supervisorOptions.length > 0 && (
        <div className={css.pendingFilters}>
          <Select
            label="Фильтр по руководителю"
            placeholder="Все руководители"
            value={supervisorFilter}
            onChange={(value) => setSupervisorFilter(value as string)}
            options={supervisorOptions}
            allowClear
          />
        </div>
      )}

      {isPendingLoading ? (
        <div className={css.pendingEmpty}>Загрузка...</div>
      ) : filteredPending.length === 0 ? (
        <div className={css.pendingEmpty}>Нет заявок, ожидающих выдачи доступа.</div>
      ) : (
        <div className={css.pendingList}>
          {filteredPending.map((user) => (
            <div key={user.id} className={css.pendingItem}>
              <div className={css.pendingInfo}>
                <div className={css.pendingName}>{user.name}</div>
                <div className={css.pendingMeta}>{user.email}</div>
                <div className={css.pendingMeta}>
                  Руководитель:{" "}
                  {user.requestedSupervisor?.name ?? "—"}
                </div>
                <div className={css.pendingMeta}>
                  Заявка от{" "}
                  {format(new Date(user.createdAt), "dd.MM.yyyy HH:mm")}
                </div>
              </div>
              <Button
                className={css.btn}
                onClick={() => openGrantModal(user)}
              >
                Назначить доступ
              </Button>
            </div>
          ))}
        </div>
      )}

      <Modal
        title={
          selectedPending
            ? `Выдача доступа: ${selectedPending.name}`
            : "Выдача доступа"
        }
        open={selectedPending !== null}
        onOk={handleGrantSubmit}
        onCancel={() => setSelectedPending(null)}
        okButtonName="Выдать доступ"
        isLoading={isGranting}
        okButtonDisabled={
          grantForm.roles.length === 0 ||
          (!isHighRole && grantForm.workplace.length === 0)
        }
        destroyOnClose
      >
        {selectedPending && (
          <div className={css.form}>
            <Select
              label="Роли"
              mode="multiple"
              value={grantForm.roles}
              onChange={(value) =>
                setGrantForm((prev) => ({
                  ...prev,
                  roles: value as UserRolesItem[],
                }))
              }
              options={getRolesOptions(currentUser?.roles)}
              placeholder="Выберите одну или несколько ролей"
            />
            <Select
              label="Доступные филиалы"
              mode="multiple"
              showSelectAll
              value={grantForm.workplace}
              onChange={(value) =>
                setGrantForm((prev) => ({
                  ...prev,
                  workplace: value as string[],
                }))
              }
              options={getWorkplaceOptions(
                projectsData?.data.projects ?? [],
                currentUser?.roles,
                currentUser?.workplace
              )}
              placeholder="Выберите филиалы"
              loading={isProjectsLoading}
              disabled={isProjectsLoading}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PendingUsersTab;
