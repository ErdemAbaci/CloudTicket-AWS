import axios from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use(
    async (config) => {
        try {
            const session = await fetchAuthSession();
            const token = session.tokens?.idToken?.toString();

            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error('Error fetching auth session', error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export const getHealth = () => api.get('/hello');
export const getEvents = () => api.get('/events');
export const getEvent = (id: string) => api.get(`/event/${id}`);
export const createEvent = (data: { name: string; date: string; price: number }) => api.post('/event', data);

export default api;
