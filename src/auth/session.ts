const STORAGE_PREFIX = import.meta.env.VITE_STORAGE_PREFIX ?? "campusbridge";

export const ACCESS_TOKEN_KEY = `${STORAGE_PREFIX}_access_token`;
export const AUTH_USER_KEY = `${STORAGE_PREFIX}_auth_user`;
export const AUTH_STATE_CHANGED_EVENT = `${STORAGE_PREFIX}_auth_state_changed`;

export interface AuthUser {
  userId: string;
  email: string;
  roles: string[];
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getAuthUser(): AuthUser | null {
  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setAuthSession(token: string, user: AuthUser) {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event(AUTH_STATE_CHANGED_EVENT));
}

export function setAccessToken(token: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
  window.dispatchEvent(new Event(AUTH_STATE_CHANGED_EVENT));
}

export function clearAuthSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  window.dispatchEvent(new Event(AUTH_STATE_CHANGED_EVENT));
}

export function isAuthenticated() {
  return Boolean(getAccessToken());
}
