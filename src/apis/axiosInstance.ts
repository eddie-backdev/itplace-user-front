import axios from 'axios';
import { USER_API_BASE_URL } from './apiConfig';

const api = axios.create({
  baseURL: USER_API_BASE_URL,
  withCredentials: true,
});

export default api;
