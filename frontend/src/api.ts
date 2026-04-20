import axios from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';
import { toast } from 'react-toastify';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
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
            console.error('Error fetching auth session', error);
        }
        return config;
    },
    (error: any) => {
        return Promise.reject(error);
    }
);

// --- GLOBAL ERROR HANDLER ---
api.interceptors.response.use(
    (response: any) => {
        return response;
    },
    (error: any) => {
        // Sunucudan (Backend'den) dönen bir hata varsa görelim
        const serverError = error.response?.data?.error || "Sunucuyla iletişim kurulamadı";
        
        if (error.response?.status === 401) {
             toast.error("Oturum süreniz doldu, lütfen tekrar giriş yapın.");
        } else {
             toast.error(`Hata: ${serverError}`);
        }
        
        return Promise.reject(error);
    }
);

export const getHealth = () => api.get('/hello');
export const getEvents = () => api.get('/events');
export const getEvent = (id: string) => api.get(`/event/${id}`);
export const createEvent = (data: { name: string; date: string; price: number; totalTickets: number; imageUrl?: string }) => api.post('/event', data);
export const purchaseTicket = (id: string) => api.post(`/event/${id}/purchase`);

// --- S3 UPLOAD ---
export const getUploadUrl = async (token: string, contentType: string) => {
    const response = await api.get('/upload-url', {
        headers: { Authorization: `Bearer ${token}` },
        params: { contentType },
    });
    return response.data; // { uploadUrl, key }
};

export const uploadFileToS3 = async (uploadUrl: string, file: File) => {
    await axios.put(uploadUrl, file, {
        headers: { "Content-Type": file.type },
    });
};

export default api;
