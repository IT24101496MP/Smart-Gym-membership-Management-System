import axios from "axios";

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/";

const authApi = axios.create({ baseURL: API_BASE_URL });

export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);
export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);

export const setTokens = (accessToken, refreshToken) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

export const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

/**
 * Decodes the JWT access token and returns the role claim (e.g. "ADMIN", "INSTRUCTOR", "CLIENT").
 * Returns null when no token is present or the token is malformed.
 */
export const getRole = () => {
  const token = getAccessToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role ?? null;
  } catch {
    return null;
  }
};

const isTokenExpired = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return !payload.exp || payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
};

export const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const { data } = await authApi.post("/api/auth/refresh", {
      refreshToken,
    });
    setTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    clearTokens();
    return false;
  }
};

/**
 * Returns true if the user has a valid (or successfully refreshed) access token.
 * Automatically refreshes the access token if it is expired but the refresh token is still valid.
 */
export const isAuthenticated = async () => {
  const accessToken = getAccessToken();
  if (!accessToken) return false;
  if (!isTokenExpired(accessToken)) return true;
  // Access token expired — try to silently refresh
  return await refreshAccessToken();
};

/**
 * Calls the backend logout endpoint to revoke the refresh token, then clears local storage.
 */
export const logout = async () => {
  const refreshToken = getRefreshToken();
  if (refreshToken) {
    try {
      await authApi.post("/api/auth/logout", { refreshToken });
    } catch {
      // Proceed with local cleanup even if the request fails
    }
  }
  clearTokens();
};

/**
 * Wrapper around fetch that automatically attaches the Authorization header
 * and retries once after a silent token refresh on 401 responses.
 * @deprecated Use the default axios instance from utils/api.js instead.
 */
export const authFetch = async (url, options = {}) => {
  const accessToken = getAccessToken();
  const headers = {
    ...options.headers,
    Authorization: `Bearer ${accessToken}`,
  };

  let response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      headers.Authorization = `Bearer ${getAccessToken()}`;
      response = await fetch(url, { ...options, headers });
    } else {
      clearTokens();
      window.location.href = "/login";
    }
  }

  return response;
};
