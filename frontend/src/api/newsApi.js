import axios from "axios";

const API_BASE_URL = "http://localhost:3005";

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "applications/json",
    }
})

export default {
    getAllFeeds() {
        return apiClient.get("/feedovi");
    },

    getFeedById(id) {
        return apiClient.get(`/feedovi/${id}`);
    },

    createFeed(data) {
        return apiClient.post("/feedovi", data);
    },

    deleteFeed(id) {
        return apiClient.delete(`/feedovi/${id}`);
    },

    updateFeed(id, data) {
        return apiClient.put(`/feedovi/${id}`, data);
    },

    updateFeedCategory(id, kategortija) {
        return apiClient.patch(`/feedovi/${id}/kategorija`, { kategorija });
    },

    getFeedsByCategory(kategorija) {
        return apiClient.get(`/feedovi/kategorija/${kategorija}`);
    },
    
    //GRUPE

    getAllGropus() {
        return apiClient.get("/grupe");
    },

    getGroupById(id) {
        return apiClient.get(`/grupe/${id}`);
    },

    createGroup(data) {
        return apiClient.post("/grupe", data);
    },

    updateGroup(id, data) {
        return apiClient.put(`/grupe/${id}`, data);
    },

    updateGroupFeedIds(id, feedIds) {
        return apiClient.patch(`/grupe/${id}/feedIds`, { feedIds });
    },
    
    deleteGroup(id) {
        return apiClient.delete(`/grupe/${id}`);
    },

    //ČLANCI

    getAllArticles() {
        return apiClient.get("/clanci");
    },

    getArticleById(id) {
        return apiClient.get(`/clanci/${id}`);
    },

    getArticlesByFeedId(feedId) {
        return apiClient.get(`/clanci/feedId/${feedId}`);
    },

    getUnreadAricles() {
        return apiClient.get("clanci/proctian/false");
    },

    createArticle(data) {
        return apiClient.post("/clanci", data);
    },

    updateArticle(id, data) {
        return apiClient.put(`/clanci/${id}`, data);
    },
    
    setArticleReadStatus(id, procitano) {
        return apiClient.patch(`/clanci/${id}/procitano`, { procitano });
    },
    
    deleteArticle(id) {
        return apiClient.delete(`/clanci/${id}`);
    },

    //inicjalizacijski endpointovi nisu tu jer iste samo sendam preko postmana.
}