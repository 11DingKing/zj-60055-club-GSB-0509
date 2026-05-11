import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/stores/user';
import router from '@/router';

const request = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

type RequestConfig = Omit<AxiosRequestConfig, 'data'> & { data?: unknown };

declare module 'axios' {
  interface AxiosInstance {
    request<T = unknown>(config: RequestConfig): Promise<T>;
    get<T = unknown>(url: string, config?: RequestConfig): Promise<T>;
    delete<T = unknown>(url: string, config?: RequestConfig): Promise<T>;
    head<T = unknown>(url: string, config?: RequestConfig): Promise<T>;
    options<T = unknown>(url: string, config?: RequestConfig): Promise<T>;
    post<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<T>;
    put<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<T>;
    patch<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<T>;
    postForm<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<T>;
    putForm<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<T>;
    patchForm<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<T>;
  }
}

request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

request.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error: AxiosError) => {
    const userStore = useUserStore();

    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as any;

      switch (status) {
        case 401:
          ElMessage.error('登录已过期，请重新登录');
          userStore.logout();
          router.push('/login');
          break;
        case 403:
          ElMessage.error('权限不足');
          break;
        case 404:
          ElMessage.error('资源不存在');
          break;
        case 500:
          ElMessage.error('服务器错误');
          break;
        default:
          ElMessage.error(data?.message || '请求失败');
      }
    } else {
      ElMessage.error('网络错误，请检查网络连接');
    }

    return Promise.reject(error);
  },
);

export default request;
