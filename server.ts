import express from 'express';
import { createServer as createViteServer } from 'vite';
import db from './src/db.ts';
import { Assignment, Locomotive, DashboardKPIs } from './src/types.ts';
import multer from 'multer';
import * as XLSX from 'xlsx';
import { parse as parseCsv } from 'csv-parse/sync';
import dayjs from 'dayjs';
import fs from 'fs';

const upload = multer({ dest: 'uploads/' });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API Routes ---

  // Import Assignments (XLSX/CSV)
  app.post('/api/import/assignments', upload.single('file'), async (req: any, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const filePath = req.file.path;
    let rows: any[] = [];

    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames.includes('Assignments') 
        ? 'Assignments' 
        : workbook.SheetNames[0];
      
      const sheet = workbook.Sheets[sheetName];
      rows = XLSX.utils.sheet_to_json(sheet, { raw: false });

      const mapping: Record<string, string[]> = {
        locomotive_number: ['locomotive_number', 'loco_number', 'Локомотив', 'Номер локомотива', 'ЛОК'],
        train_number: ['train_number', 'Поезд', 'Номер поезда', 'train'],
        from_station: ['from_station', 'От', 'Станция отправления', 'Начальная станция', 'from'],
        to_station: ['to_station', 'До', 'Станция прибытия', 'Конечная станция', 'to'],
        start_time: ['start_time', 'Начало', 'Время отправления', 'Отправление', 'start'],
        end_time: ['end_time', 'Конец', 'Время прибытия', 'Прибытие', 'end'],
        note: ['note', 'Примечание']
      };

      const getMappedValue = (row: any, key: string) => {
        const aliases = mapping[key];
        for (const alias of aliases) {
          if (row[alias] !== undefined) return row[alias];
        }
        return undefined;
      };

      let importedCount = 0;
      let conflictCount = 0;
      let createdLocos = 0;
      let createdTrains = 0;
      let createdStations = 0;
      const errors: any[] = [];

      const findLoco = db.prepare('SELECT id FROM locomotives WHERE number = ?');
      const findTrain = db.prepare('SELECT id FROM trains WHERE number = ?');
      const findStation = db.prepare('SELECT id FROM stations WHERE name = ? OR code = ?');
      const checkConflict = db.prepare(`
        SELECT id FROM assignments 
        WHERE locomotive_id = ? 
        AND start_time < ? AND end_time > ?
      `);

      db.transaction(() => {
        rows.forEach((row, index) => {
          try {
            const locoNum = getMappedValue(row, 'locomotive_number');
            const trainNum = getMappedValue(row, 'train_number');
            const fromStation = getMappedValue(row, 'from_station');
            const toStation = getMappedValue(row, 'to_station');
            const startTimeRaw = getMappedValue(row, 'start_time');
            const endTimeRaw = getMappedValue(row, 'end_time');
            const note = getMappedValue(row, 'note') || '';

            if (!locoNum || !trainNum || !fromStation || !toStation || !startTimeRaw || !endTimeRaw) {
              errors.push({ row_index: index + 2, message: 'Отсутствуют обязательные поля', raw_row: row });
              return;
            }

            const startTime = dayjs(startTimeRaw).toISOString();
            const endTime = dayjs(endTimeRaw).toISOString();

            if (startTime === 'Invalid Date' || endTime === 'Invalid Date') {
              errors.push({ row_index: index + 2, message: 'Неверный формат даты', raw_row: row });
              return;
            }

            if (dayjs(startTime).isAfter(dayjs(endTime))) {
              errors.push({ row_index: index + 2, message: 'Время начала позже времени окончания', raw_row: row });
              return;
            }

            // Upsert Logic
            let loco = findLoco.get(locoNum) as any;
            if (!loco) {
              const res = db.prepare("INSERT INTO locomotives (number, model, depot, current_station_id) VALUES (?, 'Unknown', 'Imported', 1)").run(locoNum);
              loco = { id: res.lastInsertRowid };
              createdLocos++;
            }

            let train = findTrain.get(trainNum) as any;
            if (!train) {
              const res = db.prepare("INSERT INTO trains (number, category, route_description) VALUES (?, 'cargo', 'Imported Route')").run(trainNum);
              train = { id: res.lastInsertRowid };
              createdTrains++;
            }

            const getOrUpdateStation = (name: string) => {
              let s = findStation.get(name, name) as any;
              if (!s) {
                const res = db.prepare('INSERT INTO stations (name, code) VALUES (?, ?)').run(name, name.substring(0, 3).toUpperCase());
                s = { id: res.lastInsertRowid };
                createdStations++;
              }
              return s.id;
            };

            const sA = getOrUpdateStation(fromStation);
            const sB = getOrUpdateStation(toStation);

            // Find or Create Shoulder
            let shoulder = db.prepare('SELECT id FROM shoulders WHERE station_a_id = ? AND station_b_id = ?').get(sA, sB) as any;
            if (!shoulder) {
              const res = db.prepare('INSERT INTO shoulders (station_a_id, station_b_id, distance_km, allowed_loco_models) VALUES (?, ?, 100, "Any")').run(sA, sB);
              shoulder = { id: res.lastInsertRowid };
            }

            // Conflict Check
            const conflict = checkConflict.get(loco.id, endTime, startTime) as any;
            let status = 'planned';
            let conflictReason = null;

            if (conflict) {
              status = 'conflict';
              conflictReason = `Пересечение с подвязкой #${conflict.id}`;
              conflictCount++;
            }

            db.prepare(`
              INSERT INTO assignments (locomotive_id, train_id, shoulder_id, start_time, end_time, status, conflict_reason, note)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).run(loco.id, train.id, shoulder.id, startTime, endTime, status, conflictReason, note);

            importedCount++;
          } catch (err: any) {
            errors.push({ row_index: index + 2, message: err.message, raw_row: row });
          }
        });
      })();

      res.json({ 
        imported_rows: importedCount, 
        created_locomotives: createdLocos,
        created_trains: createdTrains,
        created_stations: createdStations,
        conflicts_count: conflictCount, 
        errors 
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    } finally {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
  });

  // Graph Data with Filtering
  app.get('/api/graph', (req, res) => {
    const from = req.query.from as string;
    const to = req.query.to as string;

    const locos = db.prepare('SELECT id, number FROM locomotives ORDER BY number ASC').all() as any[];
    const assignments = db.prepare(`
      SELECT a.*, l.number as loco_number, t.number as train_number,
             s1.name as from_station, s2.name as to_station
      FROM assignments a
      JOIN locomotives l ON a.locomotive_id = l.id
      JOIN trains t ON a.train_id = t.id
      JOIN shoulders sh ON a.shoulder_id = sh.id
      JOIN stations s1 ON sh.station_a_id = s1.id
      JOIN stations s2 ON sh.station_b_id = s2.id
      WHERE (? IS NULL OR a.end_time >= ?) AND (? IS NULL OR a.start_time <= ?)
      ORDER BY a.start_time ASC
    `).all(from, from, to, to) as any[];

    const groups = locos.map(l => ({ id: l.id, title: l.number }));
    const items = assignments.map(a => ({
      id: a.id,
      group: a.locomotive_id,
      title: `${a.train_number}: ${a.from_station}→${a.to_station}`,
      start_time: dayjs(a.start_time).valueOf(),
      end_time: dayjs(a.end_time).valueOf(),
      className: a.status === 'conflict' ? 'bg-rose-500 border-rose-700 text-white' : 'bg-ktz-blue border-blue-800 text-white',
      itemProps: {
        'data-tooltip': `${a.train_number} | ${a.from_station}→${a.to_station} | ${a.status} ${a.conflict_reason || ''}`
      },
      status: a.status,
      conflict_reason: a.conflict_reason,
      train_number: a.train_number,
      route: `${a.from_station} → ${a.to_station}`
    }));

    res.json({ groups, items });
  });

  // Conflicts with Filtering
  app.get('/api/conflicts', (req, res) => {
    const from = req.query.from as string;
    const to = req.query.to as string;

    const conflicts = db.prepare(`
      SELECT a.*, l.number as loco_number, t.number as train_number,
             s1.name || ' -> ' || s2.name as shoulder_name
      FROM assignments a
      JOIN locomotives l ON a.locomotive_id = l.id
      JOIN trains t ON a.train_id = t.id
      JOIN shoulders sh ON a.shoulder_id = sh.id
      JOIN stations s1 ON sh.station_a_id = s1.id
      JOIN stations s2 ON sh.station_b_id = s2.id
      WHERE a.status = 'conflict'
      AND (? IS NULL OR a.end_time >= ?) AND (? IS NULL OR a.start_time <= ?)
      ORDER BY a.start_time DESC
    `).all(from, from, to, to);
    res.json(conflicts);
  });

  // Locomotives
  app.get('/api/locomotives', (req, res) => {
    const locos = db.prepare(`
      SELECT l.*, s.name as current_station_name 
      FROM locomotives l 
      LEFT JOIN stations s ON l.current_station_id = s.id
    `).all();
    res.json(locos);
  });

  app.get('/api/locomotives/:id', (req, res) => {
    const loco = db.prepare(`
      SELECT l.*, s.name as current_station_name 
      FROM locomotives l 
      LEFT JOIN stations s ON l.current_station_id = s.id
      WHERE l.id = ?
    `).get(req.params.id);
    res.json(loco);
  });

  // Trains
  app.get('/api/trains', (req, res) => {
    const trains = db.prepare('SELECT * FROM trains').all();
    res.json(trains);
  });

  // Shoulders
  app.get('/api/shoulders', (req, res) => {
    const shoulders = db.prepare(`
      SELECT sh.*, s1.name as station_a_name, s2.name as station_b_name 
      FROM shoulders sh
      JOIN stations s1 ON sh.station_a_id = s1.id
      JOIN stations s2 ON sh.station_b_id = s2.id
    `).all();
    res.json(shoulders);
  });

  // Assignments
  app.get('/api/assignments', (req, res) => {
    const assignments = db.prepare(`
      SELECT a.*, l.number as loco_number, t.number as train_number, 
             s1.name || ' -> ' || s2.name as shoulder_name
      FROM assignments a
      JOIN locomotives l ON a.locomotive_id = l.id
      JOIN trains t ON a.train_id = t.id
      JOIN shoulders sh ON a.shoulder_id = sh.id
      JOIN stations s1 ON sh.station_a_id = s1.id
      JOIN stations s2 ON sh.station_b_id = s2.id
      ORDER BY a.start_time DESC
    `).all();
    res.json(assignments);
  });

  app.post('/api/assignments', (req, res) => {
    const { locomotive_id, train_id, shoulder_id, start_time, end_time } = req.body;
    
    // Conflict check before insert
    const existing = db.prepare(`
      SELECT id FROM assignments 
      WHERE locomotive_id = ? 
      AND start_time < ? AND end_time > ?
    `).get(locomotive_id, end_time, start_time) as any;

    let status = 'planned';
    let conflict_reason = null;

    if (existing) {
      status = 'conflict';
      conflict_reason = `Пересечение с подвязкой #${existing.id}`;
    }

    const result = db.prepare(`
      INSERT INTO assignments (locomotive_id, train_id, shoulder_id, start_time, end_time, status, conflict_reason)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(locomotive_id, train_id, shoulder_id, start_time, end_time, status, conflict_reason);

    res.json({ id: result.lastInsertRowid, status, conflict_reason });
  });

  // Recommendations
  app.get('/api/recommend/:shoulder_id', (req, res) => {
    const shoulderId = req.params.shoulder_id;
    const shoulder = db.prepare('SELECT * FROM shoulders WHERE id = ?').get(shoulderId) as any;
    
    if (!shoulder) return res.status(404).json({ error: 'Shoulder not found' });

    const allowedModels = shoulder.allowed_loco_models.split(',');
    
    // Find locos at start station or nearby
    const candidates = db.prepare(`
      SELECT l.*, s.name as current_station_name
      FROM locomotives l
      JOIN stations s ON l.current_station_id = s.id
      WHERE l.status = 'idle'
    `).all() as any[];

    const scored = candidates.map(loco => {
      let score = 0;
      const isAllowed = allowedModels.includes(loco.model);
      const isAtStation = loco.current_station_id === shoulder.station_a_id;
      
      if (!isAllowed) return null;
      
      if (isAtStation) score += 50;
      score += (loco.fuel_level / 2); // More fuel is better
      score += (loco.sand_level / 4);
      
      return { ...loco, score };
    }).filter(c => c !== null).sort((a, b) => b.score - a.score).slice(0, 3);

    res.json(scored);
  });

  // Dashboard KPIs
  app.get('/api/dashboard/kpis', (req, res) => {
    const totalAssignments = db.prepare('SELECT COUNT(*) as count FROM assignments').get() as any;
    const completedAssignments = db.prepare("SELECT COUNT(*) as count FROM assignments WHERE status = 'completed'").get() as any;
    const conflicts = db.prepare("SELECT COUNT(*) as count FROM assignments WHERE status = 'conflict'").get() as any;
    
    const locoStats = {
      working: (db.prepare("SELECT COUNT(*) as count FROM locomotives WHERE status = 'enroute'").get() as any).count,
      service: (db.prepare("SELECT COUNT(*) as count FROM locomotives WHERE status = 'service'").get() as any).count,
      reserve: (db.prepare("SELECT COUNT(*) as count FROM locomotives WHERE status = 'idle'").get() as any).count,
    };

    const kpis: DashboardKPIs = {
      completed_rate: totalAssignments.count > 0 ? (completedAssignments.count / totalAssignments.count) * 100 : 0,
      avg_idle_hours: 0, // Set to 0 or calculate if data exists
      conflict_count: conflicts.count,
      loco_stats: locoStats
    };

    res.json(kpis);
  });

  // Stations
  app.get('/api/stations', (req, res) => {
    const stations = db.prepare('SELECT * FROM stations').all();
    res.json(stations);
  });

  // Import (Mock)
  app.post('/api/import/locomotives', (req, res) => {
    // In a real app, we'd use a CSV parser here
    res.json({ message: 'Импорт успешно завершен', count: 10 });
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
