import { UserRolesItem } from "../../apiV2/a7-service/model";
import { getRolesOptions } from "./helpers";

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
