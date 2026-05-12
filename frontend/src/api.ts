import axios, { type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';
import { toast } from 'react-toastify';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
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
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

// --- GLOBAL ERROR HANDLER ---
api.interceptors.response.use(
    (response: AxiosResponse) => {
        return response;
    },
    (error: AxiosError<{ error?: string }>) => {
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
export const getEvents = (params?: { search?: string; category?: string; tags?: string[]; limit?: number }) => api.get('/events', {
    params: {
        ...params,
        tags: params?.tags?.join(','),
    },
});
export const getEvent = (id: string) => api.get(`/event/${id}`);
export const createEvent = (data: { name: string; date: string; price: number; totalTickets: number; imageUrl?: string; category?: string; tags?: string[]; basePrice?: number }) => api.post('/event', data);
export const purchaseTicket = (id: string) => api.post(`/event/${id}/purchase`);
export const getMyTickets = () => api.get('/my-tickets');
export const getRecommendations = (params?: { limit?: number }) => api.get('/recommendations', { params });

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
