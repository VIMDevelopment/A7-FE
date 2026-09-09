import { UserRolesItem } from "../../apiV2/a7-service/model";
import { EXPLORER_VIEW_ROLES, canRunExplorer } from "./access";

describe("ModelExplorer access [R-11]", () => {
  it("[R-11] вкладку видят админ и все руководители, но не maker и не capability-роли", () => {
    expect(EXPLORER_VIEW_ROLES).toContain(UserRolesItem.admin);
    expect(EXPLORER_VIEW_ROLES).toContain(UserRolesItem.owner);
    expect(EXPLORER_VIEW_ROLES).toContain(UserRolesItem.agency);
    expect(EXPLORER_VIEW_ROLES).toContain(UserRolesItem.cluster);
    expect(EXPLORER_VIEW_ROLES).toContain(UserRolesItem.supervisor);
    expect(EXPLORER_VIEW_ROLES).not.toContain(UserRolesItem.maker);
    expect(EXPLORER_VIEW_ROLES).not.toContain(UserRolesItem.prompt);
    expect(EXPLORER_VIEW_ROLES).not.toContain(UserRolesItem.remote);
  });

  it("[R-11] элементы запуска доступны только админу", () => {
    expect(canRunExplorer([UserRolesItem.admin])).toBe(true);
    expect(canRunExplorer([UserRolesItem.owner])).toBe(false);
    expect(canRunExplorer([UserRolesItem.supervisor])).toBe(false);
    expect(canRunExplorer([])).toBe(false);
    expect(canRunExplorer(undefined)).toBe(false);
  });
});
