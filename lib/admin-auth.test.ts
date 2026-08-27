import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { requireAdmin } from "./admin-auth";

function adminRequest(authorization?: string) {
  return new NextRequest("https://crowvo.test/admin", {
    headers: authorization ? { authorization } : undefined,
  });
}

function basicAuth(username: string, password: string) {
  return `Basic ${Buffer.from(`${username}:${password}`, "utf8").toString("base64")}`;
}

describe("requireAdmin", () => {
  beforeEach(() => {
    vi.stubEnv("ADMIN_USERNAME", "crowvo-admin");
    vi.stubEnv("ADMIN_PASSWORD", "pa:ssword");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("accepts valid Basic auth credentials, including passwords containing colons", async () => {
    await expect(requireAdmin(adminRequest(basicAuth("crowvo-admin", "pa:ssword")))).resolves.toEqual({ ok: true });
  });

  it("rejects requests when admin credentials are not configured", async () => {
    vi.stubEnv("ADMIN_USERNAME", "");

    await expect(requireAdmin(adminRequest(basicAuth("crowvo-admin", "pa:ssword")))).rejects.toThrow(
      "ADMIN_USERNAME / ADMIN_PASSWORD are not configured.",
    );
  });

  it("rejects missing or malformed Basic auth headers", async () => {
    await expect(requireAdmin(adminRequest())).rejects.toThrow(
      "Missing or invalid authorization. Use Basic auth (username + password).",
    );

    await expect(requireAdmin(adminRequest("Bearer token"))).rejects.toThrow(
      "Missing or invalid authorization. Use Basic auth (username + password).",
    );

    await expect(
      requireAdmin(adminRequest(`Basic ${Buffer.from("crowvo-admin", "utf8").toString("base64")}`)),
    ).rejects.toThrow("Missing or invalid authorization. Use Basic auth (username + password).");
  });

  it("rejects wrong usernames or passwords without throwing on different-length values", async () => {
    await expect(requireAdmin(adminRequest(basicAuth("wrong-admin", "pa:ssword")))).rejects.toThrow(
      "Invalid admin credentials.",
    );

    await expect(requireAdmin(adminRequest(basicAuth("crowvo-admin", "short")))).rejects.toThrow(
      "Invalid admin credentials.",
    );
  });
});
