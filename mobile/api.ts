import axios from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';

const api = axios.create({
    baseURL: process.env.EXPO_PUBLIC_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    async (config: any) => {
        try {
            const session = await fetchAuthSession();
            const token = session.tokens?.idToken?.toString();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.log('No valid session found for API call');
        }
        return config;
    },
    (error: any) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response: any) => {
        return response;
    },
    (error: any) => {
        const serverError = error.response?.data?.error || "Sunucuyla iletişim kurulamadı";
        console.error("API Error: ", serverError);
        return Promise.reject(error);
    }
);

export const getEvents = () => api.get('/events');
export const getEvent = (id: string) => api.get(`/event/${id}`);
export const purchaseTicket = (id: string) => api.post(`/event/${id}/purchase`);
export const getMyTickets = () => api.get('/my-tickets');

export default api;
