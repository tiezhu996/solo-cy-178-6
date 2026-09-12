import { STORAGE_KEYS } from '../config/constants.js';

function getToken() {
  return localStorage.getItem(STORAGE_KEYS.TOKEN);
}

function setToken(token, penName) {
  localStorage.setItem(STORAGE_KEYS.TOKEN, token);
  if (penName) localStorage.setItem(STORAGE_KEYS.PEN_NAME, penName);
}

function clearToken() {
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  localStorage.removeItem(STORAGE_KEYS.PEN_NAME);
}

function getPenName() {
  return localStorage.getItem(STORAGE_KEYS.PEN_NAME);
}

async function request(url, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, { ...options, headers });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const err = new Error(data.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  getToken,
  setToken,
  clearToken,
  getPenName,
  request
};
