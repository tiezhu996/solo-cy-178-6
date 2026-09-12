import { api } from './http.js';
import { ENDPOINTS } from '../config/constants.js';

export const AuthApi = {
  register({ penName, password }) {
    return api.request(ENDPOINTS.REGISTER, {
      method: 'POST',
      body: JSON.stringify({ penName, password })
    });
  },
  login({ penName, password }) {
    return api.request(ENDPOINTS.LOGIN, {
      method: 'POST',
      body: JSON.stringify({ penName, password })
    });
  },
  me() {
    return api.request(ENDPOINTS.ME);
  }
};
