export const MIN_PASSWORD_LENGTH = 12;

export function validateNewPassword(password: string, confirmation: string) {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (password !== confirmation) {
    return "The passwords do not match.";
  }
  return "";
}

export function isPublicAuthPath(pathname: string) {
  return ["/login", "/guard", "/forgot-password", "/account/update-password"].some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}
