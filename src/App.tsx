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
  X,
  Plus,
  Search,
  Filter,
  ChevronRight,
  Clock,
  Fuel,
  Info,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Timeline from 'react-calendar-timeline';
import 'react-calendar-timeline/dist/style.css';
import dayjs from 'dayjs';
import { api } from './api';
import { 
  Locomotive, Train, Shoulder, Assignment, DashboardKPIs, Station, EfficiencyRecord, OptimizationSuggestion 
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getDashboardKPIs()
      .then(setKpis)
      .catch(err => setError(err.message));
    api.getAssignments()
      .then(data => setRecentAssignments(data.slice(0, 5)))
      .catch(err => console.error(err));
  }, []);

  if (error) return (
    <div className="p-6 bg-rose-50 border border-rose-100 rounded-xl text-rose-600">
      <div className="flex items-center space-x-2 mb-2 font-bold">
        <AlertTriangle size={20} />
        <span>Ошибка загрузки данных</span>
      </div>
      <p className="text-sm">{error}</p>
      <button 
        onClick={() => window.location.reload()}
        className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-semibold"
      >
        Попробовать снова
      </button>
    </div>
  );

  if (!kpis) return <div className="animate-pulse">Загрузка...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-ktz-blue">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-slate-500 font-medium">Выполнено рейсов</p>
              <h2 className="text-3xl font-bold mt-1">{(kpis.completed_rate || 0).toFixed(1)}%</h2>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg text-ktz-blue">
              <ClipboardList size={24} />
            </div>
          </div>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-slate-500 font-medium">Эффективность парка</p>
              <h2 className="text-3xl font-bold mt-1">{kpis.fleet_efficiency}%</h2>
            </div>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <Activity size={24} />
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
              <p className="text-sm text-slate-500 font-medium">Самый загруженный</p>
              <h2 className="text-xl font-bold mt-1">{kpis.busiest_loco}</h2>
              <p className="text-[10px] text-slate-400 uppercase mt-1">Локомотив</p>
            </div>
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <TrendingUp size={24} />
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

const EfficiencyPage = () => {
  const [data, setData] = useState<EfficiencyRecord[]>([]);
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
    to: dayjs().format('YYYY-MM-DD')
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [eff, opt] = await Promise.all([
        api.getEfficiency(dateRange.from, dateRange.to),
        api.getOptimization(dateRange.from, dateRange.to)
      ]);
      setData(eff);
      setSuggestions(opt);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getEffColor = (eff: string) => {
    const val = parseFloat(eff);
    if (val > 85) return 'text-emerald-600 bg-emerald-50';
    if (val > 70) return 'text-amber-600 bg-amber-50';
    return 'text-rose-600 bg-rose-50';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <h1 className="text-2xl font-bold text-slate-800">Эффективность парка</h1>
        <div className="flex items-center space-x-4">
          <input 
            type="date" 
            className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
            value={dateRange.from}
            onChange={e => setDateRange({ ...dateRange, from: e.target.value })}
          />
          <input 
            type="date" 
            className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
            value={dateRange.to}
            onChange={e => setDateRange({ ...dateRange, to: e.target.value })}
          />
          <button 
            onClick={fetchData}
            className="px-4 py-2 bg-ktz-blue text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Обновить
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Показатели локомотивов" className="lg:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 text-xs uppercase tracking-wider border-b border-slate-100">
                  <th className="pb-3 font-semibold">Локомотив</th>
                  <th className="pb-3 font-semibold">Работа (ч)</th>
                  <th className="pb-3 font-semibold">Простой (ч)</th>
                  <th className="pb-3 font-semibold">Сервис (ч)</th>
                  <th className="pb-3 font-semibold">Эффективность</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.map(row => (
                  <tr key={row.locomotive_id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 font-bold text-slate-700">{row.locomotive_number}</td>
                    <td className="py-4 text-slate-600">{row.total_run_hours}ч</td>
                    <td className="py-4 text-slate-600">{row.total_idle_hours}ч</td>
                    <td className="py-4 text-amber-600 font-medium">{row.total_service_hours}ч</td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getEffColor(row.efficiency_percent)}`}>
                        {row.efficiency_percent}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-6">
          <Card title="Рекомендации по оптимизации">
            <div className="space-y-4">
              {suggestions.length > 0 ? suggestions.map((s, i) => (
                <div key={i} className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                  <div className="flex items-center space-x-2 text-ktz-blue mb-2">
                    <TrendingUp size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">Перераспределение</span>
                  </div>
                  <p className="text-sm text-slate-700 font-medium mb-1">
                    Переназначить рейс {s.train_number}
                  </p>
                  <p className="text-xs text-slate-500">
                    {s.reason}
                  </p>
                </div>
              )) : (
                <div className="text-center py-8 text-slate-400">
                  <p>Рекомендаций пока нет</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

const GraphPage = () => {
  const [data, setData] = useState<{ groups: any[], items: any[] }>({ groups: [], items: [] });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: dayjs().subtract(3, 'day').format('YYYY-MM-DD'),
    to: dayjs().add(3, 'day').format('YYYY-MM-DD')
  });
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const fetchGraph = () => {
    setLoading(true);
    api.getGraphData(
      dayjs(dateRange.from).startOf('day').toISOString(), 
      dayjs(dateRange.to).endOf('day').toISOString()
    ).then(res => {
      setData(res);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchGraph();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <h1 className="text-2xl font-bold text-slate-800">График оборота</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-xs font-bold text-slate-400 uppercase">От:</label>
            <input 
              type="date" 
              className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
              value={dateRange.from}
              onChange={e => setDateRange({ ...dateRange, from: e.target.value })}
            />
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-xs font-bold text-slate-400 uppercase">До:</label>
            <input 
              type="date" 
              className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
              value={dateRange.to}
              onChange={e => setDateRange({ ...dateRange, to: e.target.value })}
            />
          </div>
          <button 
            onClick={fetchGraph}
            className="px-4 py-2 bg-ktz-blue text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Построить график
          </button>
          <div className="h-8 w-px bg-slate-200 mx-2"></div>
          <div className="flex space-x-2">
            <Badge variant="info">Рейс</Badge>
            <Badge variant="danger">Конфликт</Badge>
            <Badge variant="default">Простой</Badge>
          </div>
          <div className="text-xs text-slate-400 ml-4">
            Групп: {data.groups.length} | Элементов: {data.items.length}
          </div>
        </div>
      </div>

      <Card className="p-0 overflow-hidden border-none shadow-lg h-[600px] relative">
        {loading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-ktz-blue border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        <div className="timeline-container h-full">
          {!loading && data.groups.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <Map size={48} className="mb-4 opacity-20" />
              <p>Нет данных для отображения. Попробуйте изменить период или импортировать данные.</p>
            </div>
          ) : (
            <Timeline
              groups={data.groups}
              items={data.items}
              keys={{
                groupIdKey: 'id',
                groupTitleKey: 'title',
                groupRightTitleKey: 'rightTitle',
                groupLabelKey: 'label',
                itemIdKey: 'id',
                itemTitleKey: 'title',
                itemDivTitleKey: 'title',
                itemGroupKey: 'group',
                itemTimeStartKey: 'start_time',
                itemTimeEndKey: 'end_time'
              }}
              defaultTimeStart={dayjs().subtract(12, 'hour').valueOf()}
              defaultTimeEnd={dayjs().add(12, 'hour').valueOf()}
              lineHeight={60}
              itemHeightRatio={0.75}
              canMove={false}
              canResize={false}
              stackItems
              sidebarWidth={150}
              rightSidebarWidth={0}
              minZoom={60 * 60 * 1000}
              maxZoom={365 * 24 * 60 * 60 * 1000}
              onItemClick={(itemId) => {
                const item = data.items.find(i => i.id === itemId);
                setSelectedItem(item);
              }}
              timeSteps={{
                second: 1,
                minute: 1,
                hour: 1,
                day: 1,
                month: 1,
                year: 1
              }}
            />
          )}
        </div>
      </Card>

      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h2 className="font-bold text-slate-800">Детали подвязки #{selectedItem.id}</h2>
                <button onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between">
                  <span className="text-slate-500">Поезд:</span>
                  <span className="font-bold">{selectedItem.train_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Маршрут:</span>
                  <span className="font-bold">{selectedItem.route}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Начало:</span>
                  <span className="font-medium">{dayjs(selectedItem.start_time).format('DD.MM.YYYY HH:mm')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Конец:</span>
                  <span className="font-medium">{dayjs(selectedItem.end_time).format('DD.MM.YYYY HH:mm')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Статус:</span>
                  <Badge variant={selectedItem.status === 'conflict' ? 'danger' : selectedItem.status === 'violation' ? 'warning' : 'info'}>
                    {selectedItem.status}
                  </Badge>
                </div>
                {selectedItem.violation_reason && (
                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-amber-700 text-sm">
                    <p className="font-bold mb-1">Нарушение правил:</p>
                    {selectedItem.violation_reason}
                  </div>
                )}
                {selectedItem.conflict_reason && (
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg text-rose-600 text-sm">
                    <p className="font-bold mb-1">Причина конфликта:</p>
                    {selectedItem.conflict_reason}
                  </div>
                )}
                <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-slate-400 uppercase font-bold mb-1">Дистанция</p>
                    <p className="text-slate-700 font-medium">{selectedItem.distance_km || 0} км</p>
                  </div>
                  <div>
                    <p className="text-slate-400 uppercase font-bold mb-1">Топливо</p>
                    <p className="text-slate-700 font-medium">{selectedItem.required_fuel?.toFixed(1) || 0} л</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .timeline-container .react-calendar-timeline .rct-header-group {
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }
        .timeline-container .react-calendar-timeline .rct-sidebar {
          background: #ffffff;
          border-right: 1px solid #e2e8f0;
          font-weight: 600;
          color: #1e293b;
        }
        .timeline-container .react-calendar-timeline .rct-item {
          border-radius: 6px;
          font-size: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  );
};

const ImportPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await api.importAssignments(file);
      setResult(res);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Ошибка при импорте');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-slate-800">Импорт данных</h1>
        <p className="text-slate-500">Загрузите файлы CSV или XLSX для массового добавления подвязок</p>
      </div>

      <Card>
        <div className="space-y-6">
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center hover:border-ktz-blue transition-colors group">
            <input 
              type="file" 
              id="file-upload" 
              className="hidden" 
              accept=".csv,.xlsx,.xls"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <label htmlFor="file-upload" className="cursor-pointer space-y-4 block">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto group-hover:bg-blue-50 transition-colors">
                <Plus size={32} className="text-slate-400 group-hover:text-ktz-blue" />
              </div>
              <div>
                <p className="font-bold text-slate-700">{file ? file.name : 'Выберите файл или перетащите его сюда'}</p>
                <p className="text-sm text-slate-400">Поддерживаются .csv, .xlsx, .xls</p>
              </div>
            </label>
          </div>

          <div className="bg-slate-50 p-6 rounded-xl space-y-4">
            <h4 className="font-bold text-slate-800 flex items-center">
              <Info size={18} className="mr-2 text-ktz-blue" />
              Требования к формату колонок:
            </h4>
            <ul className="grid grid-cols-2 gap-2 text-sm text-slate-600">
              <li className="flex items-center"><ChevronRight size={14} className="mr-1 text-ktz-blue" /> locomotive_number</li>
              <li className="flex items-center"><ChevronRight size={14} className="mr-1 text-ktz-blue" /> train_number</li>
              <li className="flex items-center"><ChevronRight size={14} className="mr-1 text-ktz-blue" /> from_station</li>
              <li className="flex items-center"><ChevronRight size={14} className="mr-1 text-ktz-blue" /> to_station</li>
              <li className="flex items-center"><ChevronRight size={14} className="mr-1 text-ktz-blue" /> start_time</li>
              <li className="flex items-center"><ChevronRight size={14} className="mr-1 text-ktz-blue" /> end_time</li>
            </ul>
          </div>

          <button 
            disabled={!file || loading}
            onClick={handleImport}
            className="w-full py-4 bg-ktz-blue text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none flex items-center justify-center space-x-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <ClipboardList size={20} />
                <span>Начать импорт</span>
              </>
            )}
          </button>
        </div>
      </Card>

      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card title="Результаты импорта">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <div className="text-center p-4 bg-slate-50 rounded-xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Импортировано</p>
                <p className="text-xl font-bold text-slate-800">{result.imported_rows}</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Локомотивы</p>
                <p className="text-xl font-bold text-blue-600">{result.created_locomotives}</p>
              </div>
              <div className="text-center p-4 bg-indigo-50 rounded-xl">
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Станции</p>
                <p className="text-xl font-bold text-indigo-600">{result.created_stations}</p>
              </div>
              <div className="text-center p-4 bg-rose-50 rounded-xl">
                <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Конфликтов</p>
                <p className="text-xl font-bold text-rose-600">{result.conflicts_count}</p>
              </div>
              <div className="text-center p-4 bg-amber-50 rounded-xl">
                <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Ошибок</p>
                <p className="text-xl font-bold text-amber-600">{result.errors?.length || 0}</p>
              </div>
            </div>

            {(result.errors?.length || 0) > 0 && (
              <div className="space-y-2">
                <p className="font-bold text-slate-700">Журнал ошибок:</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 uppercase">
                        <th className="p-2">Стр.</th>
                        <th className="p-2">Ошибка</th>
                        <th className="p-2">Данные</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {result.errors.map((err: any, i: number) => (
                        <tr key={i}>
                          <td className="p-2 font-bold text-slate-400">{err.row_index}</td>
                          <td className="p-2 text-rose-600">{err.message}</td>
                          <td className="p-2 text-slate-400 font-mono truncate max-w-[200px]">{JSON.stringify(err.raw_row)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Card>
        </motion.div>
      )}
    </div>
  );
};

const ConflictsPage = ({ setActiveTab }: { setActiveTab: (tab: string) => void }) => {
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    api.getConflicts().then(setConflicts);
  }, []);

  const filtered = Array.isArray(conflicts) ? conflicts.filter(c => 
    c.loco_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.train_number?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <h1 className="text-2xl font-bold text-slate-800">Конфликты расписания</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Поиск по локомотиву или поезду..."
            className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm w-80"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Локомотив</th>
                <th className="px-6 py-4">Поезд</th>
                <th className="px-6 py-4">Маршрут</th>
                <th className="px-6 py-4">Время</th>
                <th className="px-6 py-4">Причина</th>
                <th className="px-6 py-4 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-700">{c.loco_number}</td>
                  <td className="px-6 py-4 text-slate-600">{c.train_number}</td>
                  <td className="px-6 py-4 text-slate-500 text-sm">{c.shoulder_name}</td>
                  <td className="px-6 py-4 text-sm">
                    <div className="text-slate-700 font-medium">{dayjs(c.start_time).format('DD.MM HH:mm')}</div>
                    <div className="text-slate-400 text-xs">{dayjs(c.end_time).format('DD.MM HH:mm')}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-rose-600 text-xs bg-rose-50 px-2 py-1 rounded-md border border-rose-100">
                      {c.conflict_reason}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setActiveTab('graph')}
                      className="text-ktz-blue hover:underline text-sm font-medium"
                    >
                      Показать на графике
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                    Конфликтов не обнаружено
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

const LocomotiveList = () => {
  const [locos, setLocos] = useState<Locomotive[]>([]);
  const [filter, setFilter] = useState('');
  const [servicing, setServicing] = useState<number | null>(null);

  const refresh = () => api.getLocomotives().then(setLocos);

  useEffect(() => {
    refresh();
  }, []);

  const handleService = async (id: number) => {
    if (!confirm('Выполнить полное обслуживание локомотива?')) return;
    setServicing(id);
    try {
      await api.performService(id, { station_id: 1, service_type: 'full' });
      await refresh();
    } catch (err) {
      alert('Ошибка при выполнении обслуживания');
    } finally {
      setServicing(null);
    }
  };

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
        {filtered.map(l => {
          const fuelPct = (l.fuel_current / l.fuel_capacity) * 100;
          const kmPct = (l.run_km_since_service / l.max_run_km) * 100;
          const hrPct = (l.run_hours_since_service / l.max_run_hours) * 100;
          const needsService = kmPct > 90 || hrPct > 90 || fuelPct < 15;

          return (
            <motion.div layout key={l.id}>
              <Card className={`hover:shadow-md transition-shadow group ${needsService ? 'border-amber-200 bg-amber-50/10' : ''}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 group-hover:text-ktz-blue transition-colors">{l.number}</h3>
                    <p className="text-sm text-slate-500">{l.model} • {l.depot}</p>
                  </div>
                  <Badge variant={l.status === 'idle' ? 'success' : l.status === 'enroute' ? 'info' : 'warning'}>
                    {l.status}
                  </Badge>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center text-sm text-slate-600">
                    <Map size={14} className="mr-2 opacity-50" />
                    <span>{l.current_station_name || 'Неизвестно'}</span>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-500">
                      <span>Топливо ({(l.fuel_current || 0).toFixed(0)}/{(l.fuel_capacity || 0)}л)</span>
                      <span>{(fuelPct || 0).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${fuelPct < 20 ? 'bg-rose-500' : 'bg-ktz-blue'}`} 
                        style={{ width: `${fuelPct || 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-500">
                      <span>Пробег до ТО ({(l.run_km_since_service || 0)}/{(l.max_run_km || 0)}км)</span>
                      <span>{(kmPct || 0).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${kmPct > 90 ? 'bg-rose-500' : 'bg-amber-400'}`} 
                        style={{ width: `${kmPct || 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-500">
                      <span>Часы до ТО ({(l.run_hours_since_service || 0).toFixed(1)}/{(l.max_run_hours || 0)}ч)</span>
                      <span>{(hrPct || 0).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${hrPct > 90 ? 'bg-rose-500' : 'bg-indigo-400'}`} 
                        style={{ width: `${hrPct || 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <button 
                      onClick={() => handleService(l.id)}
                      disabled={servicing === l.id}
                      className={`w-full py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center space-x-2 ${
                        needsService 
                          ? 'bg-amber-500 text-white hover:bg-amber-600' 
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {servicing === l.id ? (
                        <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <Settings size={14} />
                          <span>Обслуживание</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
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
    end_time: new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 16),
    note: ''
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
    setFormData({
      train_id: '',
      shoulder_id: '',
      locomotive_id: '',
      start_time: new Date().toISOString().slice(0, 16),
      end_time: new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 16),
      note: ''
    });
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
                <th className="pb-3 font-semibold">Примечание</th>
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
                  <td className="py-4 text-sm text-slate-500 max-w-[200px] truncate" title={a.note}>
                    {a.note || '-'}
                  </td>
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
                  <X size={20} />
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

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Примечание</label>
                  <textarea 
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-ktz-blue/20 min-h-[100px]"
                    placeholder="Введите дополнительную информацию..."
                    value={formData.note}
                    onChange={e => setFormData({ ...formData, note: e.target.value })}
                  />
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
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  useEffect(() => {
    api.checkHealth()
      .then(() => setApiOnline(true))
      .catch(() => setApiOnline(false));
  }, []);

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
            icon={Map} 
            label="График (Гант)" 
            active={activeTab === 'graph'} 
            onClick={() => setActiveTab('graph')} 
          />
          <SidebarItem 
            icon={TrendingUp} 
            label="Эффективность" 
            active={activeTab === 'efficiency'} 
            onClick={() => setActiveTab('efficiency')} 
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
            icon={Plus} 
            label="Импорт данных" 
            active={activeTab === 'import'} 
            onClick={() => setActiveTab('import')} 
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
            {apiOnline === false && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-rose-50 text-rose-700 rounded-full text-xs font-bold border border-rose-100">
                <AlertTriangle size={14} />
                <span>API Offline: запустите сервер</span>
              </div>
            )}
            {apiOnline === true && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span>API Online</span>
              </div>
            )}
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
              {activeTab === 'graph' && <GraphPage />}
              {activeTab === 'efficiency' && <EfficiencyPage />}
              {activeTab === 'locomotives' && <LocomotiveList />}
              {activeTab === 'assignments' && <AssignmentManager />}
              {activeTab === 'import' && <ImportPage />}
              {activeTab === 'conflicts' && <ConflictsPage setActiveTab={setActiveTab} />}
              {activeTab === 'trains' && (
                <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
                  <TrainIcon size={64} className="mb-4 opacity-20" />
                  <p className="text-xl font-medium">Модуль "Поезда" в разработке</p>
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
