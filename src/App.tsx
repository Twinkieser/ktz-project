/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Train as TrainIcon, 
  Activity, 
  Settings, 
  AlertTriangle, 
  ClipboardList, 
  Map, 
  LogOut,
  Plus,
  Search,
  Filter,
  ChevronRight,
  Clock,
  Fuel,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from './api';
import { 
  Locomotive, Train, Shoulder, Assignment, DashboardKPIs, Station 
} from './types';

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
      active 
        ? 'bg-ktz-blue text-white shadow-md' 
        : 'text-slate-600 hover:bg-slate-100'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </button>
);

const Card = ({ title, children, className = "" }: any) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${className}`}>
    {title && (
      <div className="px-6 py-4 border-bottom border-slate-100 bg-slate-50/50">
        <h3 className="font-semibold text-slate-800">{title}</h3>
      </div>
    )}
    <div className="p-6">{children}</div>
  </div>
);

const Badge = ({ children, variant = "default" }: any) => {
  const variants: any = {
    default: "bg-slate-100 text-slate-600",
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
    danger: "bg-rose-100 text-rose-700",
    info: "bg-blue-100 text-blue-700",
  };
  return (
    <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${variants[variant]}`}>
      {children}
    </span>
  );
};

// --- Pages ---

const Dashboard = () => {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [recentAssignments, setRecentAssignments] = useState<Assignment[]>([]);

  useEffect(() => {
    api.getDashboardKPIs().then(setKpis);
    api.getAssignments().then(data => setRecentAssignments(data.slice(0, 5)));
  }, []);

  if (!kpis) return <div className="animate-pulse">Загрузка...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-ktz-blue">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-slate-500 font-medium">Выполнено рейсов</p>
              <h2 className="text-3xl font-bold mt-1">{kpis.completed_rate.toFixed(1)}%</h2>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg text-ktz-blue">
              <ClipboardList size={24} />
            </div>
          </div>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-slate-500 font-medium">Средний простой</p>
              <h2 className="text-3xl font-bold mt-1">{kpis.avg_idle_hours}ч</h2>
            </div>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <Clock size={24} />
            </div>
          </div>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-slate-500 font-medium">Конфликты</p>
              <h2 className="text-3xl font-bold mt-1">{kpis.conflict_count}</h2>
            </div>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <AlertTriangle size={24} />
            </div>
          </div>
        </Card>
        <Card className="border-l-4 border-l-indigo-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-slate-500 font-medium">Локомотивы (Резерв)</p>
              <h2 className="text-3xl font-bold mt-1">{kpis.loco_stats.reserve}</h2>
            </div>
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <Activity size={24} />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Последние подвязки" className="lg:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 text-xs uppercase tracking-wider border-b border-slate-100">
                  <th className="pb-3 font-semibold">Поезд</th>
                  <th className="pb-3 font-semibold">Локомотив</th>
                  <th className="pb-3 font-semibold">Плечо</th>
                  <th className="pb-3 font-semibold">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentAssignments.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 font-medium">{a.train_number}</td>
                    <td className="py-4">{a.loco_number}</td>
                    <td className="py-4 text-sm text-slate-500">{a.shoulder_name}</td>
                    <td className="py-4">
                      <Badge variant={a.status === 'conflict' ? 'danger' : a.status === 'completed' ? 'success' : 'info'}>
                        {a.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card title="Статус парка">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">В работе</span>
              <span className="font-bold text-ktz-blue">{kpis.loco_stats.working}</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-ktz-blue h-full" style={{ width: `${(kpis.loco_stats.working / (kpis.loco_stats.working + kpis.loco_stats.reserve + kpis.loco_stats.service)) * 100}%` }}></div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">В резерве</span>
              <span className="font-bold text-emerald-600">{kpis.loco_stats.reserve}</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full" style={{ width: `${(kpis.loco_stats.reserve / (kpis.loco_stats.working + kpis.loco_stats.reserve + kpis.loco_stats.service)) * 100}%` }}></div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">На ТО/Ремонте</span>
              <span className="font-bold text-amber-600">{kpis.loco_stats.service}</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-amber-500 h-full" style={{ width: `${(kpis.loco_stats.service / (kpis.loco_stats.working + kpis.loco_stats.reserve + kpis.loco_stats.service)) * 100}%` }}></div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

const LocomotiveList = () => {
  const [locos, setLocos] = useState<Locomotive[]>([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    api.getLocomotives().then(setLocos);
  }, []);

  const filtered = locos.filter(l => 
    l.number.toLowerCase().includes(filter.toLowerCase()) || 
    l.model.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Локомотивный парк</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Поиск по номеру или модели..." 
            className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ktz-blue/20 w-64"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filtered.map(l => (
          <motion.div layout key={l.id}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer group">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 group-hover:text-ktz-blue transition-colors">{l.number}</h3>
                  <p className="text-sm text-slate-500">{l.model} • {l.depot}</p>
                </div>
                <Badge variant={l.status === 'idle' ? 'success' : l.status === 'enroute' ? 'info' : 'warning'}>
                  {l.status}
                </Badge>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center text-sm text-slate-600">
                  <Map size={14} className="mr-2 opacity-50" />
                  <span>{l.current_station_name || 'Неизвестно'}</span>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-medium text-slate-500">
                    <span>Топливо</span>
                    <span>{l.fuel_level}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${l.fuel_level < 20 ? 'bg-rose-500' : 'bg-ktz-blue'}`} 
                      style={{ width: `${l.fuel_level}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-medium text-slate-500">
                    <span>Песок</span>
                    <span>{l.sand_level}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-amber-400 h-full" style={{ width: `${l.sand_level}%` }}></div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-50 flex justify-between items-center text-xs text-slate-400">
                  <span>Наработка: {l.total_hours}ч</span>
                  <span>ТО через: {500 - l.last_service_hours}ч</span>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const AssignmentManager = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [trains, setTrains] = useState<Train[]>([]);
  const [shoulders, setShoulders] = useState<Shoulder[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    train_id: '',
    shoulder_id: '',
    locomotive_id: '',
    start_time: new Date().toISOString().slice(0, 16),
    end_time: new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 16)
  });

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    api.getAssignments().then(setAssignments);
    api.getTrains().then(setTrains);
    api.getShoulders().then(setShoulders);
  };

  const handleShoulderChange = (id: string) => {
    setFormData({ ...formData, shoulder_id: id, locomotive_id: '' });
    if (id) {
      api.getRecommendations(parseInt(id)).then(setRecommendations);
    } else {
      setRecommendations([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.createAssignment(formData);
    setShowModal(false);
    refreshData();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Управление подвязками</h1>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-ktz-blue text-white px-4 py-2 rounded-lg font-semibold flex items-center space-x-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
        >
          <Plus size={20} />
          <span>Новая подвязка</span>
        </button>
      </div>

      <Card title="График подвязок">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-400 text-xs uppercase tracking-wider border-b border-slate-100">
                <th className="pb-3 font-semibold">ID</th>
                <th className="pb-3 font-semibold">Поезд</th>
                <th className="pb-3 font-semibold">Локомотив</th>
                <th className="pb-3 font-semibold">Плечо</th>
                <th className="pb-3 font-semibold">Начало</th>
                <th className="pb-3 font-semibold">Конец</th>
                <th className="pb-3 font-semibold">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {assignments.map(a => (
                <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 text-sm text-slate-400">#{a.id}</td>
                  <td className="py-4 font-bold">{a.train_number}</td>
                  <td className="py-4">{a.loco_number}</td>
                  <td className="py-4 text-sm text-slate-500">{a.shoulder_name}</td>
                  <td className="py-4 text-sm">{new Date(a.start_time).toLocaleString('ru-RU')}</td>
                  <td className="py-4 text-sm">{new Date(a.end_time).toLocaleString('ru-RU')}</td>
                  <td className="py-4">
                    <div className="flex flex-col">
                      <Badge variant={a.status === 'conflict' ? 'danger' : a.status === 'completed' ? 'success' : 'info'}>
                        {a.status}
                      </Badge>
                      {a.conflict_reason && (
                        <span className="text-[10px] text-rose-500 mt-1 max-w-[150px] leading-tight">
                          {a.conflict_reason}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800">Создание подвязки</h2>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                  <LogOut size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Поезд</label>
                    <select 
                      required
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-ktz-blue/20"
                      value={formData.train_id}
                      onChange={e => setFormData({ ...formData, train_id: e.target.value })}
                    >
                      <option value="">Выберите поезд...</option>
                      {trains.map(t => <option key={t.id} value={t.id}>{t.number} ({t.route_description})</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Плечо обслуживания</label>
                    <select 
                      required
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-ktz-blue/20"
                      value={formData.shoulder_id}
                      onChange={e => handleShoulderChange(e.target.value)}
                    >
                      <option value="">Выберите плечо...</option>
                      {shoulders.map(s => <option key={s.id} value={s.id}>{s.station_a_name} → {s.station_b_name}</option>)}
                    </select>
                  </div>
                </div>

                {recommendations.length > 0 && (
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-700 flex items-center">
                      <Activity size={16} className="mr-2 text-ktz-blue" />
                      Рекомендованные локомотивы
                    </label>
                    <div className="grid grid-cols-1 gap-3">
                      {recommendations.map(r => (
                        <div 
                          key={r.id}
                          onClick={() => setFormData({ ...formData, locomotive_id: r.id.toString() })}
                          className={`p-4 border-2 rounded-xl cursor-pointer transition-all flex justify-between items-center ${
                            formData.locomotive_id === r.id.toString() 
                              ? 'border-ktz-blue bg-blue-50' 
                              : 'border-slate-100 hover:border-slate-200'
                          }`}
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                              <TrainIcon size={20} className="text-ktz-blue" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-800">{r.number}</p>
                              <p className="text-xs text-slate-500">{r.model} • Топливо: {r.fuel_level}%</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="success">Score: {Math.round(r.score)}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Время начала</label>
                    <input 
                      type="datetime-local" 
                      required
                      className="w-full p-2 border border-slate-200 rounded-lg"
                      value={formData.start_time}
                      onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Время окончания</label>
                    <input 
                      type="datetime-local" 
                      required
                      className="w-full p-2 border border-slate-200 rounded-lg"
                      value={formData.end_time}
                      onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                    />
                  </div>
                </div>

                <div className="pt-6 flex space-x-4">
                  <button 
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Отмена
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-ktz-blue text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                  >
                    Подтвердить подвязку
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="flex h-screen bg-ktz-gray overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-8 flex items-center space-x-3">
          <div className="w-10 h-10 bg-ktz-blue rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <TrainIcon size={24} />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight text-slate-800">КТЖ</h1>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Диспетчер</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <SidebarItem 
            icon={LayoutDashboard} 
            label="Дашборд" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <SidebarItem 
            icon={Activity} 
            label="Локомотивы" 
            active={activeTab === 'locomotives'} 
            onClick={() => setActiveTab('locomotives')} 
          />
          <SidebarItem 
            icon={ClipboardList} 
            label="Подвязки" 
            active={activeTab === 'assignments'} 
            onClick={() => setActiveTab('assignments')} 
          />
          <SidebarItem 
            icon={TrainIcon} 
            label="Поезда" 
            active={activeTab === 'trains'} 
            onClick={() => setActiveTab('trains')} 
          />
          <SidebarItem 
            icon={AlertTriangle} 
            label="Конфликты" 
            active={activeTab === 'conflicts'} 
            onClick={() => setActiveTab('conflicts')} 
          />
          <SidebarItem 
            icon={Settings} 
            label="Настройки" 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
          />
        </nav>

        <div className="p-6 border-t border-slate-100">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
              <img src="https://picsum.photos/seed/user/100/100" alt="Avatar" referrerPolicy="no-referrer" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Диспетчер А.К.</p>
              <p className="text-xs text-slate-500">Управление ЦУП</p>
            </div>
          </div>
          <button className="w-full flex items-center justify-center space-x-2 py-2 text-rose-500 font-semibold hover:bg-rose-50 rounded-lg transition-colors">
            <LogOut size={18} />
            <span>Выйти</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2 text-sm text-slate-500">
            <span>Главная</span>
            <ChevronRight size={14} />
            <span className="font-medium text-slate-800 capitalize">{activeTab}</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span>Система в норме</span>
            </div>
            <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <Info size={20} />
            </button>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && <Dashboard />}
              {activeTab === 'locomotives' && <LocomotiveList />}
              {activeTab === 'assignments' && <AssignmentManager />}
              {activeTab === 'trains' && (
                <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
                  <TrainIcon size={64} className="mb-4 opacity-20" />
                  <p className="text-xl font-medium">Модуль "Поезда" в разработке</p>
                </div>
              )}
              {activeTab === 'conflicts' && (
                <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
                  <AlertTriangle size={64} className="mb-4 opacity-20" />
                  <p className="text-xl font-medium">Конфликтов не обнаружено</p>
                </div>
              )}
              {activeTab === 'settings' && (
                <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
                  <Settings size={64} className="mb-4 opacity-20" />
                  <p className="text-xl font-medium">Настройки системы</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
