import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database('loco_dispatcher.db');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS stations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL
  );

  CREATE TABLE IF NOT EXISTS trains (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    number TEXT UNIQUE NOT NULL,
    category TEXT CHECK(category IN ('passenger', 'cargo')) NOT NULL,
    route_description TEXT
  );

  CREATE TABLE IF NOT EXISTS shoulders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_a_id INTEGER REFERENCES stations(id),
    station_b_id INTEGER REFERENCES stations(id),
    distance_km REAL NOT NULL,
    allowed_loco_models TEXT,
    min_turnaround_mins INTEGER DEFAULT 60
  );

  CREATE TABLE IF NOT EXISTS locomotives (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    number TEXT UNIQUE NOT NULL,
    model TEXT NOT NULL,
    depot TEXT NOT NULL,
    current_station_id INTEGER REFERENCES stations(id),
    status TEXT CHECK(status IN ('idle', 'enroute', 'service', 'repair', 'conflict')) DEFAULT 'idle',
    fuel_level REAL DEFAULT 100.0,
    sand_level REAL DEFAULT 100.0,
    last_service_hours REAL DEFAULT 0.0,
    total_hours REAL DEFAULT 0.0
  );

  CREATE TABLE IF NOT EXISTS schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    train_id INTEGER REFERENCES trains(id),
    station_id INTEGER REFERENCES stations(id),
    arrival_time TEXT,
    departure_time TEXT,
    day_offset INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    locomotive_id INTEGER REFERENCES locomotives(id),
    train_id INTEGER REFERENCES trains(id),
    shoulder_id INTEGER REFERENCES shoulders(id),
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    status TEXT CHECK(status IN ('planned', 'active', 'completed', 'conflict')) DEFAULT 'planned',
    conflict_reason TEXT,
    note TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_assignments_loco_time ON assignments(locomotive_id, start_time, end_time);
  CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);

  CREATE TABLE IF NOT EXISTS service_points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_id INTEGER REFERENCES stations(id),
    type TEXT CHECK(type IN ('fuel', 'sand', 'inspection')) NOT NULL,
    service_time_mins INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS service_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    locomotive_id INTEGER REFERENCES locomotives(id),
    service_point_id INTEGER REFERENCES service_points(id),
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
    fuel_added REAL DEFAULT 0,
    sand_added REAL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    action TEXT NOT NULL,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
    details TEXT
  );
`);

// Seed data if empty
const stationCount = db.prepare('SELECT COUNT(*) as count FROM stations').get() as { count: number };
if (stationCount.count === 0) {
  const insertStation = db.prepare('INSERT INTO stations (name, code) VALUES (?, ?)');
  const stations = [
    ['Нур-Султан (Астана)', 'AST'],
    ['Алматы-1', 'ALM1'],
    ['Алматы-2', 'ALM2'],
    ['Караганда', 'KRG'],
    ['Шымкент', 'SHY'],
    ['Актобе', 'AKT'],
    ['Павлодар', 'PVL'],
    ['Кокшетау', 'KOK']
  ];
  stations.forEach(s => insertStation.run(s[0], s[1]));

  const insertTrain = db.prepare('INSERT INTO trains (number, category, route_description) VALUES (?, ?, ?)');
  const trains = [
    ['001X', 'passenger', 'Алматы - Астана'],
    ['002X', 'passenger', 'Астана - Алматы'],
    ['641A', 'passenger', 'Павлодар - Астана'],
    ['407Ц', 'passenger', 'Караганда - Астана'],
    ['353Б', 'cargo', 'Актобе - Шымкент'],
    ['6833', 'cargo', 'Кокшетау - Астана']
  ];
  trains.forEach(t => insertTrain.run(t[0], t[1], t[2]));

  const insertLoco = db.prepare('INSERT INTO locomotives (number, model, depot, current_station_id, status, fuel_level, sand_level) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const locos = [
    ['KZ4A-0001', 'KZ4A', 'Алматы', 1, 'idle', 85, 90],
    ['KZ4A-0002', 'KZ4A', 'Алматы', 2, 'idle', 40, 60],
    ['TE33A-0123', 'TE33A', 'Астана', 1, 'idle', 95, 100],
    ['TE33A-0124', 'TE33A', 'Астана', 3, 'idle', 10, 30],
    ['VL80-1542', 'VL80', 'Караганда', 4, 'idle', 70, 80],
    ['VL80-1543', 'VL80', 'Караганда', 1, 'idle', 100, 100],
    ['2TE10-5521', '2TE10', 'Актобе', 6, 'idle', 55, 45],
    ['2TE10-5522', '2TE10', 'Актобе', 5, 'idle', 80, 70]
  ];
  locos.forEach(l => insertLoco.run(l[0], l[1], l[2], l[3], l[4], l[5], l[6]));

  const insertShoulder = db.prepare('INSERT INTO shoulders (station_a_id, station_b_id, distance_km, allowed_loco_models, min_turnaround_mins) VALUES (?, ?, ?, ?, ?)');
  const shoulders = [
    [1, 2, 1200, 'KZ4A,TE33A', 120],
    [2, 1, 1200, 'KZ4A,TE33A', 120],
    [1, 4, 200, 'KZ4A,TE33A,VL80', 60],
    [4, 1, 200, 'KZ4A,TE33A,VL80', 60],
    [6, 5, 1500, '2TE10,TE33A', 180],
    [8, 1, 300, 'TE33A,VL80', 60]
  ];
  shoulders.forEach(sh => insertShoulder.run(sh[0], sh[1], sh[2], sh[3], sh[4]));

  const insertServicePoint = db.prepare('INSERT INTO service_points (station_id, type, service_time_mins) VALUES (?, ?, ?)');
  const servicePoints = [
    [1, 'fuel', 45],
    [1, 'sand', 30],
    [1, 'inspection', 60],
    [2, 'fuel', 45],
    [4, 'fuel', 45]
  ];
  servicePoints.forEach(sp => insertServicePoint.run(sp[0], sp[1], sp[2]));
}

export default db;
