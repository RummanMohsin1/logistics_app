import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

console.log("API_BASE_URL", API_BASE_URL);
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// ── Carrier Endpoints ──
export const carrierAPI = {
    listGroups: () => apiClient.get('/carriers'),
    getGroup: (id) => apiClient.get(`/carriers/${id}`),
    getGroupServices: (id) => apiClient.get(`/carriers/${id}/services`),
    searchServices: (params, config = {}) => apiClient.get('/services', { params, ...config }),
    getService: (id) => apiClient.get(`/services/${id}`),
};

// ── Shipment Endpoints ──
export const shipmentAPI = {
    create: (data) => apiClient.post('/shipments', data),
    list: (params) => apiClient.get('/shipments', { params }),
    get: (id) => apiClient.get(`/shipments/${id}`),
    update: (id, data) => apiClient.put(`/shipments/${id}`, data),
    delete: (id) => apiClient.delete(`/shipments/${id}`),
    addLeg: (id, data) => apiClient.post(`/shipments/${id}/legs`, data),
    updateLeg: (id, legId, data) => apiClient.put(`/shipments/${id}/legs/${legId}`, data),
    deleteLeg: (id, legId) => apiClient.delete(`/shipments/${id}/legs/${legId}`),
    submit: (id, idempotencyKey) =>
        apiClient.post(`/shipments/${id}/submit`, {}, {
            headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {},
        }),
    transitionStatus: (id, data) => apiClient.patch(`/shipments/${id}/status`, data),
    recordException: (id, data) => apiClient.post(`/shipments/${id}/exception`, data),
    resolveException: (id, data) => apiClient.post(`/shipments/${id}/resolve-exception`, data),
};

export default apiClient;
