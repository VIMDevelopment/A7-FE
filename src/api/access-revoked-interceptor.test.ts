import { describe, it, expect, vi } from "vitest";
import { handleAccessRevoked, isAccessRevoked } from "./access-revoked-interceptor";

describe("[R-68] доступ отключён — окно уходит на вход", () => {
  it("узнаёт отказ «доступ отключён» по коду ответа 401 ACCESS_REVOKED", () => {
    expect(isAccessRevoked({ response: { status: 401, data: { code: "ACCESS_REVOKED" } } })).toBe(true);
    expect(isAccessRevoked({ response: { status: 401, data: { error: "You are not authorized!" } } })).toBe(false);
    expect(isAccessRevoked({ response: { status: 403, data: { code: "ACCESS_REVOKED" } } })).toBe(false);
    expect(isAccessRevoked(new Error("network"))).toBe(false);
  });

  it("при отказе стирает вход и уводит на страницу входа; прочие ошибки пропускает дальше", async () => {
    const logout = vi.fn();
    const revoked = { response: { status: 401, data: { code: "ACCESS_REVOKED" } } };
    await expect(handleAccessRevoked(revoked, logout)).rejects.toBe(revoked);
    expect(logout).toHaveBeenCalledTimes(1);
    const other = { response: { status: 500 } };
    await expect(handleAccessRevoked(other, logout)).rejects.toBe(other);
    expect(logout).toHaveBeenCalledTimes(1);
  });
});
