import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import db from './src/db.ts';
import { Assignment, Locomotive, DashboardKPIs } from './src/types.ts';
import multer from 'multer';
import * as XLSX from 'xlsx';
import { parse as parseCsv } from 'csv-parse/sync';
import dayjs from 'dayjs';
import minMax from 'dayjs/plugin/minMax';
dayjs.extend(minMax);
import fs from 'fs';

const storage = multer.memoryStorage();
const upload = multer({ storage });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cors({ origin: "*", credentials: false }));

  // Request logging
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  // --- API Routes ---

  // Healthcheck
  app.get('/api/health', (req, res) => {
    res.json({ ok: true });
  });

  // Perform Service
  app.post('/api/locomotives/:id/service', (req, res) => {
    const { id } = req.params;
    const { station_id, service_type } = req.body;

    const loco = db.prepare('SELECT * FROM locomotives WHERE id = ?').get(id) as any;
    if (!loco) return res.status(404).json({ error: 'Locomotive not found' });

    const now = dayjs().toISOString();
    let fuelUpdate = '';
    if (service_type === 'fuel' || service_type === 'full') {
      fuelUpdate = ', fuel_current = fuel_capacity';
    }

    db.prepare(`
      UPDATE locomotives 
      SET run_km_since_service = 0, 
          run_hours_since_service = 0, 
          last_service_time = ?,
          current_station_id = ?
          ${fuelUpdate}
      WHERE id = ?
    `).run(now, station_id, id);

    res.json({ message: 'Service completed successfully' });
  });

  // Get Graph Data with Idle Periods
  app.get('/api/graph', (req, res) => {
    const { from, to } = req.query;
    const startRange = from ? dayjs(from as string) : dayjs().startOf('day');
    const endRange = to ? dayjs(to as string) : dayjs().endOf('day');

    const assignments = db.prepare(`
      SELECT 
        a.*, 
        l.number as locomotive_number,
        t.number as train_number,
        s1.name as from_station,
        s2.name as to_station
      FROM assignments a
      JOIN locomotives l ON a.locomotive_id = l.id
      JOIN trains t ON a.train_id = t.id
      JOIN shoulders sh ON a.shoulder_id = sh.id
      JOIN stations s1 ON sh.station_a_id = s1.id
      JOIN stations s2 ON sh.station_b_id = s2.id
      WHERE a.start_time < ? AND a.end_time > ?
      ORDER BY a.locomotive_id, a.start_time ASC
    `).all(endRange.toISOString(), startRange.toISOString()) as any[];

    const locomotives = db.prepare('SELECT * FROM locomotives').all() as any[];
    const result: any[] = [];

    locomotives.forEach(loco => {
      const locoAssignments = assignments.filter(a => a.locomotive_id === loco.id);
      
      // Track state for violation checks
      let currentFuel = loco.fuel_current;
      let currentKm = loco.run_km_since_service;
      let currentHours = loco.run_hours_since_service;
      let lastEndTime: dayjs.Dayjs | null = null;

      // Add actual assignments
      locoAssignments.forEach(a => {
        const aStart = dayjs(a.start_time);
        const aEnd = dayjs(a.end_time);
        const durationHours = aEnd.diff(aStart, 'hour', true);
        
        let status = a.status;
        let violationReason = '';

        // 1. Turnaround + Fueling check
        if (lastEndTime) {
          const buffer = 40 + 30; // turnaround + fueling
          if (aStart.diff(lastEndTime, 'minute') < buffer) {
            status = 'violation';
            violationReason = 'Not enough time for fueling/turnaround';
          }
        }

        // 2. Fuel check
        const requiredFuel = a.distance_km ? a.distance_km * loco.fuel_rate_per_km : 0;
        if (currentFuel < requiredFuel) {
          status = 'violation';
          violationReason = 'Not enough fuel';
        }

        // 3. Maintenance check
        if (currentKm > loco.max_run_km || currentHours > loco.max_run_hours) {
          status = 'violation';
          violationReason = 'Service required (limit exceeded)';
        }

        result.push({
          ...a,
          status,
          violation_reason: violationReason,
          required_fuel: requiredFuel,
          type: 'assignment'
        });

        // Update state for next assignment in loop
        if (status !== 'violation') {
          currentFuel -= requiredFuel;
          currentKm += (a.distance_km || 0);
          currentHours += durationHours;
        }
        lastEndTime = aEnd;
      });

      // Calculate Idle periods
      let lastEnd = startRange;
      locoAssignments.forEach(a => {
        const aStart = dayjs(a.start_time);
        const aEnd = dayjs(a.end_time);

        if (aStart.diff(lastEnd, 'minute') > 30) {
          result.push({
            id: `idle-${loco.id}-${a.id}`,
            locomotive_id: loco.id,
            locomotive_number: loco.number,
            start_time: lastEnd.toISOString(),
            end_time: aStart.toISOString(),
            status: 'idle',
            type: 'idle'
          });
        }
        lastEnd = aEnd.isAfter(lastEnd) ? aEnd : lastEnd;
      });

      if (endRange.diff(lastEnd, 'minute') > 30) {
        result.push({
          id: `idle-end-${loco.id}`,
          locomotive_id: loco.id,
          locomotive_number: loco.number,
          start_time: lastEnd.toISOString(),
          end_time: endRange.toISOString(),
          status: 'idle',
          type: 'idle'
        });
      }
    });

    const groups = locomotives.map(l => ({ id: l.id, title: l.number }));
    const items = result.map(a => ({
      id: a.id,
      group: a.locomotive_id,
      title: a.type === 'idle' ? 'Простой' : `${a.train_number}: ${a.from_station}→${a.to_station}`,
      start_time: dayjs(a.start_time).valueOf(),
      end_time: dayjs(a.end_time).valueOf(),
      className: a.status === 'conflict' 
        ? 'bg-rose-500 border-rose-700 text-white' 
        : a.status === 'violation'
          ? 'bg-amber-500 border-amber-700 text-white'
          : a.status === 'idle' 
            ? 'bg-slate-200 border-slate-300 text-slate-500 opacity-50'
            : 'bg-ktz-blue border-blue-800 text-white',
      itemProps: {
        'data-tooltip': a.type === 'idle' 
          ? `Простой: ${dayjs(a.start_time).format('HH:mm')} - ${dayjs(a.end_time).format('HH:mm')}`
          : `${a.train_number} | ${a.from_station}→${a.to_station} | ${a.status} ${a.violation_reason || a.conflict_reason || ''} | Dist: ${a.distance_km || 0}km | Fuel: ${a.required_fuel?.toFixed(1) || 0}L`
      },
      ...a
    }));

    res.json({ groups, items });
  });

  // Efficiency Report
  app.get('/api/efficiency', (req, res) => {
    const { from, to } = req.query;
    const startRange = from ? dayjs(from as string) : dayjs().subtract(7, 'day').startOf('day');
    const endRange = to ? dayjs(to as string) : dayjs().endOf('day');

    const locos = db.prepare('SELECT id, number FROM locomotives').all() as any[];
    const assignments = db.prepare(`
      SELECT locomotive_id, start_time, end_time 
      FROM assignments 
      WHERE start_time < ? AND end_time > ?
      ORDER BY locomotive_id, start_time ASC
    `).all(endRange.toISOString(), startRange.toISOString()) as any[];

    const report = locos.map(loco => {
      const locoAssignments = assignments.filter(a => a.locomotive_id === loco.id);
      let totalRunMinutes = 0;
      
      locoAssignments.forEach(a => {
        const s = dayjs.max(dayjs(a.start_time), startRange);
        const e = dayjs.min(dayjs(a.end_time), endRange);
        if (e.isAfter(s)) {
          totalRunMinutes += e.diff(s, 'minute');
        }
      });

      // Calculate Service Time (mocked for now as time spent in 'service' status or between assignments if marked)
      // In a real app, we'd have a separate table for service events
      const serviceTimeMinutes = 0; 

      const totalPeriodMinutes = endRange.diff(startRange, 'minute');
      const totalAvailableMinutes = totalPeriodMinutes - serviceTimeMinutes;
      const totalIdleMinutes = Math.max(0, totalAvailableMinutes - totalRunMinutes);
      
      const efficiency = totalAvailableMinutes > 0 ? (totalRunMinutes / totalAvailableMinutes) * 100 : 0;

      return {
        locomotive_id: loco.id,
        locomotive_number: loco.number,
        total_run_hours: (totalRunMinutes / 60).toFixed(1),
        total_idle_hours: (totalIdleMinutes / 60).toFixed(1),
        total_service_hours: (serviceTimeMinutes / 60).toFixed(1),
        efficiency_percent: efficiency.toFixed(1)
      };
    });

    res.json(report);
  });

  // Optimization Suggestions
  app.get('/api/optimization', (req, res) => {
    const { from, to } = req.query;
    // Simple logic: find assignments with conflicts
    const suggestions: any[] = [];
    
    const assignments = db.prepare(`
      SELECT a.*, l.number as loco_num FROM assignments a 
      JOIN locomotives l ON a.locomotive_id = l.id
      WHERE a.status = 'conflict'
    `).all() as any[];

    assignments.forEach(a => {
      suggestions.push({
        suggestion_type: "reassignment",
        assignment_id: a.id,
        train_number: a.train_id, 
        from_locomotive: a.loco_num,
        reason: "Устранение конфликта и уменьшение простоя других локомотивов"
      });
    });

    res.json(suggestions);
  });
  app.post('/api/import/assignments', upload.single('file'), async (req: any, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    let rows: any[] = [];

    try {
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: true });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      console.log("Rows parsed:", rows.length);
      if (rows.length > 0) {
        console.log("First row:", rows[0]);
      } else {
        return res.status(400).json({ error: 'Файл пуст или не содержит данных' });
      }

      const mapping: Record<string, string[]> = {
        locomotive_number: ['locomotive_number', 'loco_number', 'Локомотив', 'Номер локомотива', 'ЛОК'],
        train_number: ['train_number', 'Поезд', 'Номер поезда', 'train'],
        from_station: ['from_station', 'От', 'Станция отправления', 'Начальная станция', 'from'],
        to_station: ['to_station', 'До', 'Станция прибытия', 'Конечная станция', 'to'],
        start_time: ['start_time', 'Начало', 'Время отправления', 'Отправление', 'start'],
        end_time: ['end_time', 'Конец', 'Время прибытия', 'Прибытие', 'end'],
        note: ['note', 'Примечание'],
        depot: ['depot', 'Депо', 'Depot'],
        model: ['model', 'Серия', 'Модель', 'Model']
      };

      const getMappedValue = (row: any, key: string) => {
        const aliases = mapping[key];
        for (const alias of aliases) {
          if (row[alias] !== undefined && row[alias] !== "") return row[alias];
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

      const generateStationCode = (name: string) => {
        return name
          .trim()
          .toUpperCase()
          .replace(/[^A-Z0-9А-ЯЁ]/gi, '_')
          .replace(/_+/g, '_')
          .replace(/^_|_$/g, '');
      };

      const getOrCreateStation = (name: string) => {
        const code = generateStationCode(name);
        if (!code) return null;

        const exists = db.prepare('SELECT id FROM stations WHERE code = ?').get(code);
        
        db.prepare(`
          INSERT INTO stations (code, name) VALUES (?, ?)
          ON CONFLICT(code) DO UPDATE SET name=excluded.name
        `).run(code, name);

        if (!exists) {
          createdStations++;
        }

        const s = db.prepare('SELECT id FROM stations WHERE code = ?').get(code) as any;
        return s ? s.id : null;
      };

      const getOrCreateLocomotive = (number: string, model: string = 'UNKNOWN', depot: string = 'НЕ_УКАЗАНО') => {
        const exists = db.prepare('SELECT id FROM locomotives WHERE number = ?').get(number);
        
        const res = db.prepare(`
          INSERT INTO locomotives (number, model, depot, status, fuel_level, sand_level, total_hours, current_station_id)
          VALUES (?, ?, ?, 'idle', 100, 100, 0, 1)
          ON CONFLICT(number) DO UPDATE SET
            depot = CASE WHEN excluded.depot <> 'НЕ_УКАЗАНО' THEN excluded.depot ELSE locomotives.depot END,
            model = CASE WHEN locomotives.model = 'UNKNOWN' AND excluded.model <> 'UNKNOWN' THEN excluded.model ELSE locomotives.model END
        `).run(number, model, depot);

        if (!exists) {
          createdLocos++;
        }

        const l = db.prepare('SELECT id FROM locomotives WHERE number = ?').get(number) as any;
        return l ? l.id : null;
      };

      const normalizeStatus = (s: string) => {
        const v = String(s || '').toLowerCase().trim();
        if (['planned', 'active', 'completed', 'conflict', 'violation'].includes(v)) return v;
        return 'planned';
      };

      db.transaction(() => {
        rows.forEach((row, index) => {
          try {
            console.log(`Row ${index + 2} parsed:`, row);

            const locoNum = getMappedValue(row, 'locomotive_number');
            const trainNum = getMappedValue(row, 'train_number');
            const fromStation = getMappedValue(row, 'from_station');
            const toStation = getMappedValue(row, 'to_station');
            const startTimeRaw = getMappedValue(row, 'start_time');
            const endTimeRaw = getMappedValue(row, 'end_time');
            const note = getMappedValue(row, 'note') || '';
            const depot = getMappedValue(row, 'depot') || 'НЕ_УКАЗАНО';
            const model = getMappedValue(row, 'model') || 'UNKNOWN';

            if (!locoNum || !trainNum || !fromStation || !toStation || !startTimeRaw || !endTimeRaw) {
              errors.push({ row_index: index + 2, message: 'Отсутствуют обязательные поля', raw_row: row });
              return;
            }

            // Robust date parsing
            const parseDate = (val: any) => {
              if (val instanceof Date) return dayjs(val);
              if (typeof val === 'number') {
                return dayjs(XLSX.SSF.format('yyyy-mm-dd hh:mm:ss', val));
              }
              const formats = ['YYYY-MM-DD HH:mm', 'DD.MM.YYYY HH:mm', 'YYYY-MM-DDTHH:mm:ss'];
              for (const f of formats) {
                const d = dayjs(val, f);
                if (d.isValid()) return d;
              }
              return dayjs(val);
            };

            const startD = parseDate(startTimeRaw);
            const endD = parseDate(endTimeRaw);

            if (!startD.isValid() || !endD.isValid()) {
              errors.push({ row_index: index + 2, message: 'Неверный формат даты', raw_row: row });
              return;
            }

            const startTime = startD.toISOString();
            const endTime = endD.toISOString();

            if (startD.isAfter(endD) || startD.isSame(endD)) {
              errors.push({ row_index: index + 2, message: 'Время начала должно быть раньше времени окончания', raw_row: row });
              return;
            }

            const locoId = getOrCreateLocomotive(String(locoNum), String(model), String(depot));
            const sA = getOrCreateStation(String(fromStation));
            const sB = getOrCreateStation(String(toStation));

            if (!locoId || !sA || !sB) {
              errors.push({ row_index: index + 2, message: 'Ошибка при создании связанных сущностей (локомотив/станции)', raw_row: row });
              return;
            }

            let train = findTrain.get(trainNum) as any;
            if (!train) {
              const res = db.prepare("INSERT INTO trains (number, category, route_description) VALUES (?, 'cargo', 'Imported Route')").run(trainNum);
              train = { id: res.lastInsertRowid };
              createdTrains++;
            }

            // Find or Create Shoulder
            let shoulder = db.prepare('SELECT id FROM shoulders WHERE station_a_id = ? AND station_b_id = ?').get(sA, sB) as any;
            if (!shoulder) {
              const res = db.prepare('INSERT INTO shoulders (station_a_id, station_b_id, distance_km, allowed_loco_models) VALUES (?, ?, 100, ?)').run(sA, sB, 'Any');
              shoulder = { id: res.lastInsertRowid };
            }

            // Conflict Check
            const conflict = checkConflict.get(locoId, endTime, startTime) as any;
            let status = 'planned';
            let conflictReason = null;

            if (conflict) {
              status = 'conflict';
              conflictReason = 'Time overlap';
              conflictCount++;
            }

            status = normalizeStatus(status);

            const distance_km = row.distance_km || row["Расстояние"] || null;
            const fuel_rate = 2.5; // Default rate
            const required_fuel = distance_km ? distance_km * fuel_rate : null;

            console.log("Inserting assignment:", { locoId, trainNum, sA, sB, startTime, endTime, status });

            db.prepare(`
              INSERT INTO assignments (locomotive_id, train_id, shoulder_id, start_time, end_time, status, conflict_reason, note, distance_km, required_fuel)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(locoId, train.id, shoulder.id, startTime, endTime, status, conflictReason, note, distance_km, required_fuel);

            importedCount++;
          } catch (err: any) {
            console.error(`Error processing row ${index + 2}:`, err);
            errors.push({ row_index: index + 2, message: err.message, raw_row: row });
          }
        });
      })();

      res.json({ 
        imported_rows: importedCount, 
        created_locomotives: createdLocos,
        created_stations: createdStations,
        created_trains: createdTrains,
        conflicts_count: conflictCount, 
        errors 
      });
    } catch (err: any) {
      console.error("Import error:", err);
      res.status(500).json({ error: err.message });
    }
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
    const { locomotive_id, train_id, shoulder_id, start_time, end_time, note } = req.body;
    
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
      conflict_reason = 'Time overlap';
    }

    const result = db.prepare(`
      INSERT INTO assignments (locomotive_id, train_id, shoulder_id, start_time, end_time, status, conflict_reason, note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(locomotive_id, train_id, shoulder_id, start_time, end_time, status, conflict_reason, note);

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
    
    const efficiency = db.prepare(`
      SELECT 
        AVG(efficiency) as avg_eff
      FROM (
        SELECT 
          CAST(SUM(strftime('%s', end_time) - strftime('%s', start_time)) AS REAL) / (7 * 24 * 3600) * 100 as efficiency
        FROM assignments
        WHERE start_time > datetime('now', '-7 days')
        GROUP BY locomotive_id
      )
    `).get() as any;

    const busiest = db.prepare(`
      SELECT l.number, COUNT(a.id) as count
      FROM locomotives l
      JOIN assignments a ON l.id = a.locomotive_id
      GROUP BY l.id ORDER BY count DESC LIMIT 1
    `).get() as any;

    const idlest = db.prepare(`
      SELECT l.number, SUM(strftime('%s', end_time) - strftime('%s', start_time)) as work_sec
      FROM locomotives l
      LEFT JOIN assignments a ON l.id = a.locomotive_id
      GROUP BY l.id ORDER BY work_sec ASC LIMIT 1
    `).get() as any;

    const locoStats = {
      working: (db.prepare("SELECT COUNT(*) as count FROM locomotives WHERE status = 'enroute'").get() as any)?.count || 0,
      service: (db.prepare("SELECT COUNT(*) as count FROM locomotives WHERE status = 'service'").get() as any)?.count || 0,
      reserve: (db.prepare("SELECT COUNT(*) as count FROM locomotives WHERE status = 'idle'").get() as any)?.count || 0,
    };

    res.json({
      completed_rate: totalAssignments.count > 0 ? (completedAssignments.count / totalAssignments.count) * 100 : 0,
      fleet_efficiency: (efficiency?.avg_eff || 0).toFixed(1),
      busiest_loco: busiest?.number || 'N/A',
      idlest_loco: idlest?.number || 'N/A',
      conflict_count: conflicts.count || 0,
      loco_stats: locoStats
    });
  });

  // Stations
  app.get('/api/stations', (req, res) => {
    const stations = db.prepare('SELECT id, name, code FROM stations').all();
    res.json(stations);
  });

  // Import (Mock)
  app.post('/api/import/locomotives', (req, res) => {
    // In a real app, we'd use a CSV parser here
    res.json({ message: 'Импорт успешно завершен', count: 10 });
  });

  // Global Error Handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("Unhandled Error:", err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
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
