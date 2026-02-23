import { 
  Locomotive, Train, Shoulder, Assignment, DashboardKPIs, Station 
} from './types';

const API_BASE = '/api';

export const api = {
  getLocomotives: () => fetch(`${API_BASE}/locomotives`).then(res => res.json()),
  getTrains: () => fetch(`${API_BASE}/trains`).then(res => res.json()),
  getShoulders: () => fetch(`${API_BASE}/shoulders`).then(res => res.json()),
  getAssignments: () => fetch(`${API_BASE}/assignments`).then(res => res.json()),
  getDashboardKPIs: () => fetch(`${API_BASE}/dashboard/kpis`).then(res => res.json()),
  getStations: () => fetch(`${API_BASE}/stations`).then(res => res.json()),
  getRecommendations: (shoulderId: number) => fetch(`${API_BASE}/recommend/${shoulderId}`).then(res => res.json()),
  createAssignment: (data: any) => fetch(`${API_BASE}/assignments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json()),
};
