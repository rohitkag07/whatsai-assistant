import { describe, expect, it } from "vitest";
import {
  getPasswordUpdateErrorMessage,
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

  it("explains when Supabase rejects reuse of the current password", () => {
    expect(
      getPasswordUpdateErrorMessage({
        code: "same_password",
        message: "New password should be different from the old password.",
      }),
    ).toBe("Choose a new password that is different from your current password.");
  });

  it("does not expose unexpected authentication errors", () => {
    expect(getPasswordUpdateErrorMessage(new Error("internal detail"))).toBe(
      "We could not update the password. Request a new recovery link.",
    );
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
