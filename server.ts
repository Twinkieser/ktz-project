import express from 'express';
import { createServer as createViteServer } from 'vite';
import db from './src/db.ts';
import { Assignment, Locomotive, DashboardKPIs } from './src/types.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API Routes ---

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
    
    // Simple conflict check before insert
    const existing = db.prepare(`
      SELECT * FROM assignments 
      WHERE locomotive_id = ? 
      AND (
        (start_time <= ? AND end_time >= ?) OR
        (start_time <= ? AND end_time >= ?) OR
        (start_time >= ? AND end_time <= ?)
      )
    `).get(locomotive_id, start_time, start_time, end_time, end_time, start_time, end_time);

    let status = 'planned';
    let conflict_reason = null;

    if (existing) {
      status = 'conflict';
      conflict_reason = 'Пересечение времени работы локомотива';
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
      avg_idle_hours: 12.5, // Mocked
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
