import axios from 'axios';
import { API_URL } from '../config.js';

const API_BASE_URL = API_URL;

export default {
    getAllFeeds() {
        return axios.get(`${API_BASE_URL}/feedovi`);
    },

    getFeedById(id) {
        return axios.get(`${API_BASE_URL}/feedovi/${id}`);
    },

    createFeed(data) {
        return axios.post(`${API_BASE_URL}/feedovi`, data);
    },

    deleteFeed(id) {
        return axios.delete(`${API_BASE_URL}/feedovi/${id}`);
    },

    updateFeed(id, data) {
        return axios.put(`${API_BASE_URL}/feedovi/${id}`, data);
    },

    updateFeedCategory(id, kategorija) {
        return axios.patch(`${API_BASE_URL}/feedovi/${id}/kategorija`, { kategorija });
    },

    getFeedsByCategory(kategorija) {
        return axios.get(`${API_BASE_URL}/feedovi/kategorija/${kategorija}`);
    },
    
    //GRUPE

    getAllGropus() {
        return axios.get(`${API_BASE_URL}/grupe`);
    },

    getGroupById(id) {
        return axios.get(`${API_BASE_URL}/grupe/${id}`);
    },

    createGroup(data) {
        return axios.post(`${API_BASE_URL}/grupe`, data);
    },

    updateGroup(id, data) {
        return axios.put(`${API_BASE_URL}/grupe/${id}`, data);
    },

    updateGroupFeedIds(id, feedIds) {
        return axios.patch(`${API_BASE_URL}/grupe/${id}/feedIds`, { feedIds });
    },
    
    deleteGroup(id) {
        return axios.delete(`${API_BASE_URL}/grupe/${id}`);
    },

    //ČLANCI -> ne koristiti se trenutno!!!!

    getAllArticles() {
        return axios.get(`${API_BASE_URL}/clanci`);
    },

    getArticleById(id) {
        return axios.get(`${API_BASE_URL}/clanci/${id}`);
    },

    getArticlesByFeedId(feedId) {
        return axios.get(`${API_BASE_URL}/clanci/feedId/${feedId}`);
    },

    getUnreadAricles() {
        return axios.get(`${API_BASE_URL}/clanci/proctian/false`);
    },

    createArticle(data) {
        return axios.post(`${API_BASE_URL}/clanci`, data);
    },

    updateArticle(id, data) {
        return axios.put(`${API_BASE_URL}/clanci/${id}`, data);
    },
    
    setArticleReadStatus(id, procitano) {
        return axios.patch(`${API_BASE_URL}/clanci/${id}/procitano`, { procitano });
    },
    
    deleteArticle(id) {
        return axios.delete(`${API_BASE_URL}/clanci/${id}`);
    },
}
