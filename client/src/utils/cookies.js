// Must match server/config/security.js's CSRF_COOKIE_NAME. Deliberately
// NOT httpOnly on the backend, so it's readable here and echoed back as a
// header for the double-submit CSRF check on /auth/refresh.
export const CSRF_COOKIE_NAME = "eftms_csrf_token";

export const getCookie = (name) => {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
};
