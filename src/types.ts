/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type LocoStatus = 'idle' | 'enroute' | 'service' | 'repair' | 'conflict';
export type AssignmentStatus = 'planned' | 'active' | 'completed' | 'conflict';
export type TrainCategory = 'passenger' | 'cargo';
export type ServiceType = 'fuel' | 'sand' | 'inspection';

export interface Station {
  id: number;
  name: string;
  code: string;
}

export interface Train {
  id: number;
  number: string;
  category: TrainCategory;
  route_description: string;
}

export interface Shoulder {
  id: number;
  station_a_id: number;
  station_b_id: number;
  distance_km: number;
  allowed_loco_models: string; // Comma separated
  min_turnaround_mins: number;
  station_a_name?: string;
  station_b_name?: string;
}

export interface Locomotive {
  id: number;
  number: string;
  model: string;
  depot: string;
  current_station_id: number;
  status: LocoStatus;
  fuel_level: number;
  sand_level: number;
  last_service_hours: number;
  total_hours: number;
  current_station_name?: string;
}

export interface Schedule {
  id: number;
  train_id: number;
  station_id: number;
  arrival_time: string; // HH:mm
  departure_time: string; // HH:mm
  day_offset: number;
  station_name?: string;
}

export interface Assignment {
  id: number;
  locomotive_id: number;
  train_id: number;
  shoulder_id: number;
  start_time: string; // ISO string
  end_time: string; // ISO string
  status: AssignmentStatus;
  conflict_reason?: string;
  loco_number?: string;
  train_number?: string;
  shoulder_name?: string;
}

export interface ServicePoint {
  id: number;
  station_id: number;
  type: ServiceType;
  service_time_mins: number;
  station_name?: string;
}

export interface ServiceLog {
  id: number;
  locomotive_id: number;
  service_point_id: number;
  timestamp: string;
  fuel_added: number;
  sand_added: number;
}

export interface DashboardKPIs {
  completed_rate: number;
  fleet_efficiency: string;
  busiest_loco: string;
  idlest_loco: string;
  conflict_count: number;
  loco_stats: {
    working: number;
    service: number;
    reserve: number;
  };
}

export interface EfficiencyRecord {
  locomotive_id: number;
  locomotive_number: string;
  total_run_hours: string;
  total_idle_hours: string;
  efficiency_percent: string;
}

export interface OptimizationSuggestion {
  suggestion_type: string;
  assignment_id?: number;
  train_number?: string;
  from_locomotive: string;
  to_locomotive?: string;
  reason: string;
}
