import { beforeEach, describe, expect, it, vi } from "vitest";

const mockWhere = vi.fn().mockResolvedValue(undefined);
const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
const mockUpdate = vi.fn().mockReturnValue({ set: mockSet });

vi.mock("@/db/client", () => ({
  db: {
    update: (...args: unknown[]) => mockUpdate(...args),
  },
}));

import { dues } from "@/db/schema";
import {
  enforceFrozenDuesPolicy,
  freezeMemberDues,
  unfreezeMemberDues,
} from "./frozen-policy";

describe("frozen dues policy", () => {
  beforeEach(() => {
    mockWhere.mockClear();
    mockSet.mockClear();
    mockUpdate.mockClear();
  });

  it("freezeMemberDues actualiza cuotas pendientes o vencidas a FROZEN", async () => {
    await freezeMemberDues("member-1");

    expect(mockUpdate).toHaveBeenCalledWith(dues);
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({ status: "FROZEN" }),
    );
    expect(mockWhere).toHaveBeenCalledTimes(1);
  });

  it("unfreezeMemberDues vuelve cuotas FROZEN a PENDING", async () => {
    await unfreezeMemberDues("member-1");

    expect(mockUpdate).toHaveBeenCalledWith(dues);
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({ status: "PENDING" }),
    );
  });

  it("enforceFrozenDuesPolicy congela cuando el socio está INACTIVE", async () => {
    await enforceFrozenDuesPolicy("member-1", "INACTIVE");

    const setArgs = mockSet.mock.calls.at(-1)?.[0];
    expect(setArgs?.status).toBe("FROZEN");
  });

  it("enforceFrozenDuesPolicy descongela cuando el socio deja de estar INACTIVE", async () => {
    await enforceFrozenDuesPolicy("member-1", "ACTIVE");

    const setArgs = mockSet.mock.calls.at(-1)?.[0];
    expect(setArgs?.status).toBe("PENDING");
  });
});
