import axios from 'axios';
import { API_URL } from '../config.js';


const apiClient = axios.create({
  baseURL: API_URL //'http://localhost:3005'
});


apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
