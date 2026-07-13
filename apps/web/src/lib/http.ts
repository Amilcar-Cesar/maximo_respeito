import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_URL || '';

export const http = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true
});

export function setAuthToken(token: string | null) {
  if (token) {
    http.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  delete http.defaults.headers.common.Authorization;
}
