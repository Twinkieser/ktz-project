import { 
  Locomotive, Train, Shoulder, Assignment, DashboardKPIs, Station 
} from './types';

const getBaseUrl = () => {
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
    return text; // Or throw if we strictly expect JSON
  }
};

export const api = {
  checkHealth: () => fetch(`${API_BASE}/health`).then(handleResponse),
  getLocomotives: () => fetch(`${API_BASE}/locomotives`).then(handleResponse),
  getTrains: () => fetch(`${API_BASE}/trains`).then(handleResponse),
  getShoulders: () => fetch(`${API_BASE}/shoulders`).then(handleResponse),
  getAssignments: () => fetch(`${API_BASE}/assignments`).then(handleResponse),
  getDashboardKPIs: () => fetch(`${API_BASE}/dashboard/kpis`).then(handleResponse),
  getStations: () => fetch(`${API_BASE}/stations`).then(handleResponse),
  getRecommendations: (shoulderId: number) => fetch(`${API_BASE}/recommend/${shoulderId}`).then(handleResponse),
  getGraphData: (from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    return fetch(`${API_BASE}/graph?${params}`).then(handleResponse);
  },
  getConflicts: () => fetch(`${API_BASE}/conflicts`).then(handleResponse),
  getEfficiency: (from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    return fetch(`${API_BASE}/efficiency?${params}`).then(handleResponse);
  },
  getOptimization: (from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    return fetch(`${API_BASE}/optimization?${params}`).then(handleResponse);
  },
  importAssignments: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetch(`${API_BASE}/import/assignments`, {
      method: 'POST',
      body: formData
    }).then(handleResponse);
  },
  performService: (id: number, data: { station_id: number, service_type: string }) => fetch(`${API_BASE}/locomotives/${id}/service`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  createAssignment: (data: any) => fetch(`${API_BASE}/assignments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
};
