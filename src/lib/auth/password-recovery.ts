export const MIN_PASSWORD_LENGTH = 12;

const RECOVERY_LINK_ERROR =
  "We could not update the password. Request a new recovery link.";

type AuthErrorShape = {
  code?: unknown;
  message?: unknown;
};

export function validateNewPassword(password: string, confirmation: string) {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (password !== confirmation) {
    return "The passwords do not match.";
  }
  return "";
}

export function getPasswordUpdateErrorMessage(error: unknown) {
  if (typeof error !== "object" || error === null) {
    return RECOVERY_LINK_ERROR;
  }

  const authError = error as AuthErrorShape;
  const code = typeof authError.code === "string" ? authError.code : "";
  const message =
    typeof authError.message === "string" ? authError.message.toLowerCase() : "";

  if (code === "same_password" || message.includes("different from the old password")) {
    return "Choose a new password that is different from your current password.";
  }

  return RECOVERY_LINK_ERROR;
}

export function isPublicAuthPath(pathname: string) {
  return [
    "/login",
    "/guard",
    "/forgot-password",
    "/account/update-password",
  ].some((path) => pathname === path || pathname.startsWith(`${path}/`));
}
