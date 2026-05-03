import { 
  Locomotive, Train, Shoulder, Assignment, DashboardKPIs, Station 
} from './types';

const getBaseUrl = () => {
  // In AI Studio Preview, we should ALWAYS use relative paths
  // because the frontend and backend are served through the same proxy.
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname.endsWith('.run.app') || hostname.includes('aistudio-solutions.com')) {
      console.log("[API] AI Studio environment detected, using relative paths.");
      return "";
    }
  }

  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (!envUrl) return "";
  
  // If we're in a browser and the env URL is localhost but the current page isn't,
  // default to relative paths to avoid "Failed to fetch"
  if (typeof window !== 'undefined' && 
      envUrl.includes('localhost') && 
      !window.location.hostname.includes('localhost')) {
    return "";
  }
  
  return envUrl;
};

const API_BASE_URL = getBaseUrl();
const API_BASE = `${API_BASE_URL}/api`;

const handleResponse = async (res: Response) => {
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Error ${res.status}: ${res.statusText}`);
    return data;
  } else {
    const text = await res.text();
    if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
    return text;
  }
};

const safeFetch = async (url: string, options?: RequestInit) => {
  try {
    const response = await fetch(url, options);
    return await handleResponse(response);
  } catch (error: any) {
    console.error(`[API Error] Fetch failed for ${url}:`, error);
    // Re-throw a more descriptive error
    if (error.message === 'Failed to fetch') {
      throw new Error(`Не удалось подключиться к API (${url}). Проверьте, запущен ли сервер.`);
    }
    throw error;
  }
};

export const api = {
  checkHealth: () => safeFetch(`${API_BASE}/health`),
  getLocomotives: () => safeFetch(`${API_BASE}/locomotives`),
  getTrains: () => safeFetch(`${API_BASE}/trains`),
  getShoulders: () => safeFetch(`${API_BASE}/shoulders`),
  getAssignments: () => safeFetch(`${API_BASE}/assignments`),
  getDashboardKPIs: () => safeFetch(`${API_BASE}/dashboard/kpis`),
  getStations: () => safeFetch(`${API_BASE}/stations`),
  getRecommendations: (shoulderId: number) => safeFetch(`${API_BASE}/recommend/${shoulderId}`),
  getGraphData: (from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    return safeFetch(`${API_BASE}/graph?${params}`);
  },
  getConflicts: () => safeFetch(`${API_BASE}/conflicts`),
  getEfficiency: (from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    return safeFetch(`${API_BASE}/efficiency?${params}`);
  },
  getOptimization: (from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    return safeFetch(`${API_BASE}/optimization?${params}`);
  },
  importAssignments: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return safeFetch(`${API_BASE}/import/assignments`, {
      method: 'POST',
      body: formData
    });
  },
  performService: (id: number, data: { station_id: number, service_type: string }) => safeFetch(`${API_BASE}/locomotives/${id}/service`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  createAssignment: (data: any) => safeFetch(`${API_BASE}/assignments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
};
