import { describe, expect, it } from "vitest";
import {
  isPublicAuthPath,
  MIN_PASSWORD_LENGTH,
  validateNewPassword,
} from "./password-recovery";

describe("password recovery", () => {
  it("requires a strong minimum length", () => {
    expect(validateNewPassword("short", "short")).toBe(
      `Use at least ${MIN_PASSWORD_LENGTH} characters.`,
    );
  });

  it("requires matching passwords", () => {
    expect(
      validateNewPassword("a-secure-password", "another-password"),
    ).toBe("The passwords do not match.");
  });

  it("accepts a matching password", () => {
    expect(
      validateNewPassword("a-secure-password", "a-secure-password"),
    ).toBe("");
  });

  it.each([
    "/login",
    "/guard",
    "/forgot-password",
    "/account/update-password",
  ])("keeps %s reachable without an existing session", (pathname) => {
    expect(isPublicAuthPath(pathname)).toBe(true);
  });

  it.each(["/dashboard", "/admin", "/account", "/forgot-passwords"])(
    "keeps %s protected",
    (pathname) => {
      expect(isPublicAuthPath(pathname)).toBe(false);
    },
  );
});
