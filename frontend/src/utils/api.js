import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.response.use(
  res => res,
  err => {
    const msg = err.response?.data?.error || err.message || 'Request failed';
    return Promise.reject(new Error(msg));
  }
);

export const startScan   = (url)     => api.post('/scans', { url }).then(r => r.data);
export const getScan     = (scanId)  => api.get(`/scans/${scanId}`).then(r => r.data);
export const getScans    = (limit=10)=> api.get(`/scans?limit=${limit}`).then(r => r.data);
export const deleteScan  = (scanId)  => api.delete(`/scans/${scanId}`).then(r => r.data);
export const getHealth   = ()        => api.get('/health').then(r => r.data);

export function createProgressStream(scanId, { onMessage, onError, onClose } = {}) {
  const baseURL = process.env.REACT_APP_API_URL || '/api';
  const es = new EventSource(`${baseURL}/scans/${scanId}/stream`);
  es.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      onMessage?.(data);
    } catch {}
  };
  es.onerror = (e) => {
    onError?.(e);
    es.close();
    onClose?.();
  };
  return es;
}

export default api;
