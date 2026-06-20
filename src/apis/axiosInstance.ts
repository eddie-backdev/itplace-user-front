import axios from 'axios';
import { USER_API_BASE_URL } from './apiConfig';
import { attachCsrfHeader } from './csrf';

const api = axios.create({
  baseURL: USER_API_BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use(attachCsrfHeader);

export default api;
