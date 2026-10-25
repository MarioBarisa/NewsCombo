import axios from 'axios';
import { API_URL } from '../config.js';

const API_BASE_URL = API_URL;
const requestOptions = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    timeout: 15000
});

export default {
    getAllFeeds() {
        return axios.get(`${API_BASE_URL}/feedovi`, requestOptions());
    },

    createFeed(data) {
        return axios.post(`${API_BASE_URL}/feedovi`, data, requestOptions());
    },

    deleteFeed(id) {
        return axios.delete(`${API_BASE_URL}/feedovi/${id}`, requestOptions());
    },

    getAllGroups() {
        return axios.get(`${API_BASE_URL}/grupe`, requestOptions());
    },

    createGroup(data) {
        return axios.post(`${API_BASE_URL}/grupe`, data, requestOptions());
    },

    updateGroup(id, data) {
        return axios.put(`${API_BASE_URL}/grupe/${id}`, data, requestOptions());
    },

    deleteGroup(id) {
        return axios.delete(`${API_BASE_URL}/grupe/${id}`, requestOptions());
    },
}
