import { UserRolesItem } from "../../apiV2/a7-service/model";
import {
  applyRolesSelection,
  canEditUser,
  favoritesBranchId,
  getRolesOptions,
  getWorkplaceOptions,
  isSuperadmin,
} from "./helpers";

const values = (roles: UserRolesItem[]) => getRolesOptions(roles).map((o) => o.value);

describe("getRolesOptions — роли в окне выдачи доступа", () => {
  it("админ может назначить админа («Суперадмин») и владельца — как разрешает бэк", () => {
    expect(values([UserRolesItem.admin])).toEqual(
      expect.arrayContaining([UserRolesItem.admin, UserRolesItem.owner])
    );
  });

  it("админ видит все роли: шесть уровней и две отдельные", () => {
    expect(values([UserRolesItem.admin])).toHaveLength(8);
  });

  it("владелец по-прежнему не видит админа и владельца", () => {
    expect(values([UserRolesItem.owner])).not.toContain(UserRolesItem.admin);
    expect(values([UserRolesItem.owner])).not.toContain(UserRolesItem.owner);
  });

  it("директор назначает только ниже себя и без отдельных ролей", () => {
    expect(values([UserRolesItem.agency])).toEqual([
      UserRolesItem.cluster,
      UserRolesItem.supervisor,
      UserRolesItem.maker,
    ]);
  });
});

describe("Суперадмин — все филиалы и все права по умолчанию", () => {
  const { admin, owner, agency, cluster, maker, prompt } = UserRolesItem;

  it("isSuperadmin — роль admin («Суперадмин»)", () => {
    expect(isSuperadmin([admin])).toBe(true);
    expect(isSuperadmin([owner, prompt])).toBe(false);
    expect(isSuperadmin(undefined)).toBe(false);
  });

  it("выбор «Суперадмина» оставляет только его — остальные роли не нужны", () => {
    expect(applyRolesSelection([maker], [maker, admin])).toEqual([admin]);
    expect(applyRolesSelection([admin], [admin, prompt])).toEqual([admin]);
  });

  it("«Суперадмина» можно снять, без него выбор как есть", () => {
    expect(applyRolesSelection([admin], [])).toEqual([]);
    expect(applyRolesSelection([maker], [maker, prompt])).toEqual([maker, prompt]);
  });

  it("админ редактирует владельца, но не другого админа; остальные — только ниже себя", () => {
    expect(canEditUser([admin], [owner])).toBe(true);
    expect(canEditUser([admin], [admin])).toBe(false);
    expect(canEditUser([owner], [owner])).toBe(false);
    expect(canEditUser([agency], [cluster])).toBe(true);
    expect(canEditUser([cluster], [agency])).toBe(false);
  });

  it("избранное в Explorer: первый филиал юзера, у суперадмина без филиалов — первый из списка", () => {
    expect(favoritesBranchId(["w1"], [{ id: "p1" }, { id: "p2" }])).toBe("w1");
    expect(favoritesBranchId([], [{ id: "p1" }, { id: "p2" }])).toBe("p1");
    expect(favoritesBranchId(undefined, [])).toBeUndefined();
  });
});

// Иван 09.10: «админ видит все филиалы, но добавить себе филиал не может» — у пользователя с несколькими ролями
// (например, admin + supervisor) филиалы вне его workplace были выключены, как у «чистого» руководителя.
describe("[R-49] выбор филиалов в окне доступа — по старшей роли выдающего", () => {
  const projects = [{ id: "own", name: "Свой" }, { id: "other", name: "Чужой" }];
  const disabled = (roles: UserRolesItem[]) =>
    getWorkplaceOptions(projects, roles, ["own"]).filter((o) => o.disabled).map((o) => o.value);

  it("руководитель филиала выдаёт только свои филиалы", () => {
    expect(disabled([UserRolesItem.supervisor])).toEqual(["other"]);
  });

  it.each([UserRolesItem.admin, UserRolesItem.owner, UserRolesItem.agency, UserRolesItem.cluster])(
    "%s вместе с ролью руководителя выдаёт любые филиалы",
    (senior) => {
      expect(disabled([UserRolesItem.supervisor, senior])).toEqual([]);
    }
  );
});
