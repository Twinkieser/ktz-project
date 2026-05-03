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
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
      active 
        ? 'bg-ktz-blue text-white shadow-lg shadow-blue-200' 
        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
    }`}
  >
    <Icon size={20} className={active ? 'text-white' : 'text-slate-400 group-hover:text-ktz-blue'} />
    <span className="font-semibold text-sm">{label}</span>
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

const KPICard = ({ title, value, unit, icon: Icon, trend, color }: any) => (
  <Card className="relative overflow-hidden group">
    <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10 ${color}`}></div>
    <div className="flex items-start justify-between">
      <div className="space-y-2">
        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{title}</p>
        <div className="flex items-baseline space-x-1">
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">{value}</h2>
          <span className="text-slate-400 font-medium">{unit}</span>
        </div>
        {trend !== undefined && (
          <div className={`flex items-center space-x-1 text-xs font-bold ${trend >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            <span>{trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%</span>
            <span className="text-slate-400 font-normal">vs прошлый период</span>
          </div>
        )}
      </div>
      <div className={`p-3 rounded-xl ${color} text-white shadow-lg`}>
        <Icon size={24} />
      </div>
    </div>
  </Card>
);

const StatusRow = ({ label, count, color }: any) => (
  <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
    <div className="flex items-center space-x-3">
      <div className={`w-2 h-2 rounded-full ${color}`}></div>
      <span className="text-sm font-medium text-slate-600">{label}</span>
    </div>
    <span className="font-bold text-slate-800">{count}</span>
  </div>
);

// --- Pages ---

const Dashboard = () => {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getDashboardKPIs()
      .then(setKpis)
      .catch(err => setError(err.message));
  }, []);

  if (error) return (
    <div className="p-10 bg-rose-50 border border-rose-100 rounded-3xl text-rose-600 max-w-2xl mx-auto text-center space-y-4">
      <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto text-rose-600">
        <AlertTriangle size={32} />
      </div>
      <h3 className="text-xl font-bold">Ошибка загрузки данных</h3>
      <p className="text-sm opacity-80">{error}</p>
      <button 
        onClick={() => window.location.reload()}
        className="px-6 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-200 hover:scale-105 transition-transform"
      >
        Попробовать снова
      </button>
    </div>
  );

  if (!kpis) return (
    <div className="animate-pulse space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[1,2,3,4].map(i => <div key={i} className="h-40 bg-white rounded-3xl border border-slate-100"></div>)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="h-80 bg-white rounded-3xl border border-slate-100 lg:col-span-1"></div>
        <div className="h-80 bg-white rounded-3xl border border-slate-100 lg:col-span-2"></div>
      </div>
    </div>
  );

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Обзор системы</h2>
          <p className="text-slate-500 font-medium">Мониторинг эффективности и состояния парка в реальном времени</p>
        </div>
        <div className="flex space-x-3">
          <div className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-black uppercase tracking-widest border border-emerald-100 flex items-center space-x-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span>Система: Активна</span>
          </div>
          <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-xs font-black uppercase tracking-widest border border-blue-100">
            Версия: 2.0 (Pilot)
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <KPICard 
          title="Выполнено рейсов" 
          value={`${kpis.completed_rate.toFixed(1)}%`} 
          unit=""
          icon={ClipboardList} 
          trend={2.4} 
          color="bg-blue-600"
        />
        <KPICard 
          title="Эффективность парка" 
          value={`${kpis.fleet_efficiency}`} 
          unit="%"
          icon={Activity} 
          trend={1.2} 
          color="bg-emerald-600"
        />
        <KPICard 
          title="Средний простой" 
          value={`${kpis.avg_idle_hours}`} 
          unit="ч"
          icon={Clock} 
          trend={-0.5} 
          color="bg-amber-500"
        />
        <KPICard 
          title="Конфликты" 
          value={kpis.conflict_count} 
          unit="ед"
          icon={AlertTriangle} 
          trend={kpis.conflict_count === 0 ? 0 : -10} 
          color={kpis.conflict_count > 0 ? "bg-rose-500" : "bg-slate-800"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card title="Статус парка" className="lg:col-span-1 rounded-3xl">
          <div className="space-y-6">
            <StatusRow label="В работе (Enroute)" count={kpis.loco_stats.working} color="bg-ktz-blue" />
            <StatusRow label="В резерве (Idle)" count={kpis.loco_stats.reserve} color="bg-slate-400" />
            <StatusRow label="На ТО (Service)" count={kpis.loco_stats.service} color="bg-amber-400" />
            
            <div className="pt-8 border-t border-slate-100">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Процент резерва</span>
                <span className="text-sm font-black text-slate-900">{kpis.reserve_percent}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${kpis.reserve_percent}%` }}
                  className="bg-slate-400 h-full rounded-full transition-all duration-1000 shadow-sm"
                ></motion.div>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Динамика эффективности" className="lg:col-span-2 rounded-3xl">
          <div className="h-[280px] w-full flex items-end justify-between space-x-3 pt-4">
            {kpis.efficiency_trend.map((t, i) => (
              <div key={i} className="flex-1 flex flex-col items-center group">
                <div className="w-full bg-slate-50 rounded-2xl relative flex items-end h-[220px] overflow-hidden">
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${t.value}%` }}
                    className="w-full bg-ktz-blue/10 group-hover:bg-ktz-blue/20 transition-all duration-300 rounded-t-xl border-t-4 border-ktz-blue"
                  ></motion.div>
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-xl -translate-y-2 group-hover:translate-y-0">
                    {t.value}%
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-400 mt-4 uppercase tracking-tighter">{dayjs(t.date).format('DD MMM')}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card title="Лидеры по нагрузке" className="rounded-3xl">
          <div className="flex items-center justify-between p-6 bg-slate-50/50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all cursor-pointer group">
            <div className="flex items-center space-x-5">
              <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
                <TrendingUp size={28} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Самый активный локо</p>
                <p className="text-2xl font-black text-slate-900 tracking-tight">{kpis.busiest_loco}</p>
              </div>
            </div>
            <Badge variant="info">Макс. налет</Badge>
          </div>
        </Card>
        <Card title="Аналитика оборота" className="rounded-3xl">
          <div className="flex items-center justify-between p-6 bg-slate-50/50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all cursor-pointer group">
            <div className="flex items-center space-x-5">
              <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-200 group-hover:scale-110 transition-transform">
                <Clock size={28} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Средний оборот</p>
                <p className="text-2xl font-black text-slate-900 tracking-tight">{kpis.avg_turnover_hours}ч</p>
              </div>
            </div>
            <Badge variant="warning">Цель: 18ч</Badge>
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
    if (val > 85) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (val > 70) return 'text-amber-600 bg-amber-50 border-amber-100';
    return 'text-rose-600 bg-rose-50 border-rose-100';
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-8 rounded-3xl shadow-sm border border-slate-200 gap-6">
        <div className="flex items-center space-x-5">
          <div className="w-14 h-14 bg-ktz-blue rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <TrendingUp size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Эффективность парка</h1>
            <p className="text-slate-500 font-medium">Анализ использования ресурсов и рекомендации по оптимизации</p>
          </div>
        </div>
        <div className="flex items-center space-x-4 bg-slate-50 p-2 rounded-2xl border border-slate-100">
          <input 
            type="date" 
            className="p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-ktz-blue/10 outline-none transition-all"
            value={dateRange.from}
            onChange={e => setDateRange({ ...dateRange, from: e.target.value })}
          />
          <span className="text-slate-300 font-bold">→</span>
          <input 
            type="date" 
            className="p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-ktz-blue/10 outline-none transition-all"
            value={dateRange.to}
            onChange={e => setDateRange({ ...dateRange, to: e.target.value })}
          />
          <button 
            onClick={fetchData}
            className="px-6 py-3 bg-ktz-blue text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
          >
            Обновить
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <Card title="История эффективности" className="rounded-3xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Локомотив</th>
                    <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">В работе</th>
                    <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Простой</th>
                    <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Сервис</th>
                    <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">КПД</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    [1,2,3,4,5].map(i => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={5} className="py-4"><div className="h-8 bg-slate-50 rounded-lg w-full"></div></td>
                      </tr>
                    ))
                  ) : data.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="py-4 text-sm font-black text-slate-900">{r.locomotive_number}</td>
                      <td className="py-4 text-sm font-bold text-slate-700">{r.total_run_hours}ч</td>
                      <td className="py-4 text-sm font-bold text-slate-400">{r.total_idle_hours}ч</td>
                      <td className="py-4 text-sm font-bold text-amber-600">{r.total_service_hours}ч</td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black border ${getEffColor(r.efficiency_percent)}`}>
                          {r.efficiency_percent}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-8">
          <Card title="Рекомендации ИИ" className="rounded-3xl border-2 border-blue-100 bg-blue-50/20">
            <div className="space-y-6">
              {loading ? (
                [1,2,3].map(i => <div key={i} className="h-24 bg-white rounded-2xl animate-pulse"></div>)
              ) : suggestions.map((s, i) => (
                <div key={i} className="p-5 bg-white rounded-2xl border border-blue-100 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      <Activity size={18} />
                    </div>
                    <Badge variant="info">Priority</Badge>
                  </div>
                  <p className="text-sm font-black text-slate-900 mb-2 leading-tight">
                    Переназначить рейс {s.train_number}
                  </p>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    {s.reason}
                  </p>
                  <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Потенциал</span>
                    <span className="text-xs font-black text-emerald-600">+12% КПД</span>
                  </div>
                </div>
              ))}
              {!loading && suggestions.length === 0 && (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
                    <Info size={32} />
                  </div>
                  <p className="text-slate-400 font-bold text-sm">Рекомендаций пока нет</p>
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

  const itemRenderer = ({ item, itemContext, getItemProps, getLayerProps }: any) => {
    const { left, width, style } = getItemProps({
      style: {
        background: item.status === 'conflict' ? '#f43f5e' : item.status === 'violation' ? '#f59e0b' : '#0054a6',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: '800',
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        textTransform: 'uppercase',
        letterSpacing: '0.025em'
      }
    });

    return (
      <div {...getItemProps({ style: { ...style, left, width } })}>
        <div className="truncate w-full flex items-center space-x-2">
          {item.status === 'conflict' && <AlertTriangle size={12} className="shrink-0" />}
          <span className="truncate">{item.title}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-8 rounded-3xl shadow-sm border border-slate-200 gap-6">
        <div className="flex items-center space-x-5">
          <div className="w-14 h-14 bg-ktz-blue rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <Map size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">График оборота</h1>
            <p className="text-slate-500 font-medium">Визуализация подвязок локомотивов на временной шкале</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
          <div className="flex items-center space-x-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Период:</label>
            <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <input 
                type="date" 
                className="p-2.5 text-xs font-bold outline-none border-r border-slate-100"
                value={dateRange.from}
                onChange={e => setDateRange({ ...dateRange, from: e.target.value })}
              />
              <input 
                type="date" 
                className="p-2.5 text-xs font-bold outline-none"
                value={dateRange.to}
                onChange={e => setDateRange({ ...dateRange, to: e.target.value })}
              />
            </div>
          </div>
          <button 
            onClick={fetchGraph}
            className="px-6 py-3 bg-ktz-blue text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
          >
            Построить
          </button>
          <div className="h-8 w-px bg-slate-200 mx-2 hidden lg:block"></div>
          <div className="flex items-center space-x-4">
             <div className="flex items-center space-x-2">
               <div className="w-3 h-3 bg-ktz-blue rounded-full"></div>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Рейс</span>
             </div>
             <div className="flex items-center space-x-2">
               <div className="w-3 h-3 bg-rose-500 rounded-full"></div>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Конфликт</span>
             </div>
          </div>
        </div>
      </div>

      <Card className="p-0 overflow-hidden border-2 border-slate-100 shadow-2xl h-[650px] relative rounded-3xl">
        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-md z-10 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-ktz-blue border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Загрузка данных...</p>
          </div>
        )}
        <div className="timeline-container h-full">
          {!loading && data.groups.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                <Map size={48} />
              </div>
              <div className="text-center">
                <p className="text-slate-800 font-black text-xl">Нет данных</p>
                <p className="text-sm font-medium">Попробуйте изменить период или импортировать данные</p>
              </div>
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
              defaultTimeEnd={dayjs().add(24, 'hour').valueOf()}
              lineHeight={70}
              itemHeightRatio={0.7}
              canMove={false}
              canResize={false}
              stackItems
              sidebarWidth={220}
              rightSidebarWidth={0}
              minZoom={60 * 60 * 1000}
              maxZoom={365 * 24 * 60 * 60 * 1000}
              itemRenderer={itemRenderer}
              timeSteps={{
                second: 1,
                minute: 1,
                hour: 1,
                day: 1,
                month: 1,
                year: 1
              }}
              onItemClick={(itemId) => {
                const item = data.items.find(i => i.id === itemId);
                setSelectedItem(item);
              }}
            />
          )}
        </div>
      </Card>

      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100"
            >
              <div className="bg-slate-900 p-8 text-white relative">
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-ktz-blue rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <TrainIcon size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black tracking-tight">{selectedItem.title}</h3>
                    <p className="text-blue-400 text-xs font-black uppercase tracking-widest">Детали подвязки</p>
                  </div>
                </div>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Начало</p>
                    <p className="text-lg font-black text-slate-900">{dayjs(selectedItem.start_time).format('DD.MM HH:mm')}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Конец</p>
                    <p className="text-lg font-black text-slate-900">{dayjs(selectedItem.end_time).format('DD.MM HH:mm')}</p>
                  </div>
                </div>
                
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500">Статус</span>
                    <Badge variant={selectedItem.status === 'conflict' ? 'danger' : 'success'}>
                      {selectedItem.status}
                    </Badge>
                  </div>
                  {selectedItem.conflict_reason && (
                    <div className="pt-3 border-t border-slate-200">
                      <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Причина конфликта</p>
                      <p className="text-sm font-bold text-slate-700">{selectedItem.conflict_reason}</p>
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => setSelectedItem(null)}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                >
                  Закрыть
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

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
    <div className="space-y-10">
      <div className="flex justify-between items-center bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex items-center space-x-5">
          <div className="w-14 h-14 bg-ktz-blue rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <Plus size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Импорт данных</h1>
            <p className="text-slate-500 font-medium">Загрузка расписания и данных о локомотивах из XLSX</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <Card title="Загрузка файла" className="rounded-3xl">
          <div className="space-y-8">
            <div 
              className="border-4 border-dashed border-slate-100 rounded-3xl p-12 text-center hover:border-ktz-blue/30 hover:bg-blue-50/30 transition-all cursor-pointer group"
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <input 
                id="file-upload"
                type="file" 
                className="hidden" 
                accept=".xlsx"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform text-slate-300 group-hover:text-ktz-blue">
                <Plus size={40} />
              </div>
              <p className="text-slate-900 font-black text-xl mb-2">
                {file ? file.name : 'Выберите XLSX файл'}
              </p>
              <p className="text-slate-400 font-medium text-sm">
                Перетащите файл сюда или нажмите для выбора
              </p>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Требуемые колонки:</h4>
              <div className="grid grid-cols-2 gap-3">
                {['locomotive_number', 'train_number', 'from_station', 'to_station', 'start_time', 'end_time'].map(col => (
                  <div key={col} className="flex items-center space-x-2 text-xs font-bold text-slate-600">
                    <div className="w-1.5 h-1.5 bg-ktz-blue rounded-full"></div>
                    <span>{col}</span>
                  </div>
                ))}
              </div>
            </div>

            <button 
              disabled={!file || loading}
              onClick={handleImport}
              className="w-full py-5 bg-ktz-blue text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 disabled:opacity-50 disabled:shadow-none flex items-center justify-center space-x-3"
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
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Card title="Результаты импорта" className="rounded-3xl border-2 border-emerald-100 bg-emerald-50/10">
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Импортировано</p>
                  <p className="text-3xl font-black text-slate-900 tracking-tight">{result.imported_rows}</p>
                </div>
                <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Локомотивы</p>
                  <p className="text-3xl font-black text-blue-600 tracking-tight">{result.created_locomotives}</p>
                </div>
                <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Станции</p>
                  <p className="text-3xl font-black text-indigo-600 tracking-tight">{result.created_stations}</p>
                </div>
                <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Конфликтов</p>
                  <p className="text-3xl font-black text-rose-600 tracking-tight">{result.conflicts_count}</p>
                </div>
              </div>

              {(result.errors?.length || 0) > 0 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Журнал ошибок:</h4>
                  <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="px-4 py-3 font-black text-slate-400 uppercase tracking-widest">Стр.</th>
                          <th className="px-4 py-3 font-black text-slate-400 uppercase tracking-widest">Ошибка</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {result.errors.map((err: any, i: number) => (
                          <tr key={i}>
                            <td className="px-4 py-3 font-black text-slate-400">{err.row_index}</td>
                            <td className="px-4 py-3 text-rose-600 font-bold">{err.message}</td>
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
    </div>
  );
};

const ShoulderList = () => {
  const [shoulders, setShoulders] = useState<Shoulder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getShoulders().then(res => {
      setShoulders(res);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-center bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex items-center space-x-5">
          <div className="w-14 h-14 bg-ktz-blue rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <Map size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Плечи обслуживания</h1>
            <p className="text-slate-500 font-medium">Управление маршрутами и региональными ограничениями</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="h-48 bg-white rounded-3xl animate-pulse"></div>)
        ) : shoulders.map(s => (
          <Card key={s.id} className="rounded-3xl hover:shadow-2xl transition-all group">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform">
                <Map size={24} />
              </div>
              <Badge variant={s.is_active ? 'success' : 'default'}>
                {s.is_active ? 'Активно' : 'Неактивно'}
              </Badge>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Маршрут</p>
                <p className="text-lg font-black text-slate-900 leading-tight">
                  {s.station_a_name} <span className="text-slate-300 mx-1">→</span> {s.station_b_name}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Дистанция</p>
                  <p className="text-sm font-black text-slate-900">{s.distance_km} км</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Регион</p>
                  <p className="text-sm font-black text-slate-900">{s.region}</p>
                </div>
              </div>
              <div className="pt-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Допустимые модели</p>
                <div className="flex flex-wrap gap-2">
                  {s.allowed_loco_models.map(m => (
                    <span key={m} className="px-2 py-1 bg-slate-100 text-slate-600 text-[9px] font-black rounded-lg uppercase tracking-widest">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
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
    <div className="space-y-10">
      <div className="flex justify-between items-center bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex items-center space-x-5">
          <div className="w-14 h-14 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-200">
            <AlertTriangle size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Конфликты расписания</h1>
            <p className="text-slate-500 font-medium">Обнаруженные нарушения бизнес-логики и временные наложения</p>
          </div>
        </div>
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-ktz-blue transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Поиск по локомотиву или поезду..."
            className="pl-12 pr-6 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-ktz-blue/10 focus:bg-white transition-all w-96 font-medium"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card className="p-0 overflow-hidden rounded-3xl border-2 border-slate-100 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Локомотив</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Поезд</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Маршрут</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Время</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Причина</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600">
                        <TrainIcon size={18} />
                      </div>
                      <span className="font-black text-slate-900">{c.loco_number}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-sm font-bold text-slate-600">{c.train_number}</td>
                  <td className="px-8 py-6 text-sm font-medium text-slate-500">{c.shoulder_name}</td>
                  <td className="px-8 py-6">
                    <div className="text-sm font-black text-slate-900">{dayjs(c.start_time).format('DD.MM HH:mm')}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">до {dayjs(c.end_time).format('HH:mm')}</div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="px-3 py-1.5 bg-rose-50 text-rose-600 text-[10px] font-black rounded-full border border-rose-100 uppercase tracking-widest">
                      {c.conflict_reason}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => setActiveTab('graph')}
                      className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                    >
                      На график
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500">
                        <Activity size={40} />
                      </div>
                      <div>
                        <p className="text-slate-900 font-black text-xl">Конфликтов не обнаружено</p>
                        <p className="text-slate-400 font-medium">Ваше расписание полностью соответствует бизнес-правилам</p>
                      </div>
                    </div>
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
    <div className="space-y-10">
      <div className="flex justify-between items-center bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex items-center space-x-5">
          <div className="w-14 h-14 bg-ktz-blue rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <Activity size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Локомотивный парк</h1>
            <p className="text-slate-500 font-medium">Управление техническим состоянием и экипировкой</p>
          </div>
        </div>
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-ktz-blue transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Поиск по номеру или модели..." 
            className="pl-12 pr-6 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-ktz-blue/10 focus:bg-white transition-all w-96 font-medium"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {filtered.map(l => {
          const fuelPct = (l.fuel_current / l.fuel_capacity) * 100;
          const kmPct = (l.run_km_since_service / l.max_run_km) * 100;
          const hrPct = (l.run_hours_since_service / l.max_run_hours) * 100;
          const needsService = kmPct > 90 || hrPct > 90 || fuelPct < 15;

          return (
            <motion.div layout key={l.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <Card className={`hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group rounded-3xl border-2 ${needsService ? 'border-amber-200 bg-amber-50/20' : 'border-transparent'}`}>
                <div className="flex justify-between items-start mb-6">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black text-slate-900 group-hover:text-ktz-blue transition-colors tracking-tight">{l.number}</h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{l.model}</span>
                      <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{l.depot}</span>
                    </div>
                  </div>
                  <Badge variant={l.status === 'idle' ? 'success' : l.status === 'enroute' ? 'info' : 'warning'}>
                    {l.status}
                  </Badge>
                </div>
                
                <div className="space-y-5">
                  <div className="flex items-center text-sm font-bold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <Map size={16} className="mr-3 text-ktz-blue" />
                    <span className="truncate">{l.current_station_name || 'Неизвестно'}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <span>Топливо</span>
                      <span className={fuelPct < 20 ? 'text-rose-500' : 'text-slate-900'}>{Math.round(l.fuel_current)} / {l.fuel_capacity}л</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${fuelPct}%` }}
                        className={`h-full rounded-full shadow-sm ${fuelPct < 20 ? 'bg-rose-500' : 'bg-ktz-blue'}`} 
                      ></motion.div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <span>Пробег до ТО</span>
                      <span className={kmPct > 90 ? 'text-rose-500' : 'text-slate-900'}>{l.run_km_since_service} / {l.max_run_km}км</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${kmPct}%` }}
                        className={`h-full rounded-full shadow-sm ${kmPct > 90 ? 'bg-rose-500' : 'bg-amber-400'}`} 
                      ></motion.div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100">
                    <button 
                      onClick={() => handleService(l.id)}
                      disabled={servicing === l.id}
                      className={`w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center space-x-3 shadow-lg ${
                        needsService 
                          ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-amber-200 hover:scale-105' 
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200 shadow-none'
                      }`}
                    >
                      {servicing === l.id ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <Settings size={16} />
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
  const [locomotives, setLocomotives] = useState<Locomotive[]>([]);
  const [trains, setTrains] = useState<Train[]>([]);
  const [shoulders, setShoulders] = useState<Shoulder[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    locomotive_id: '',
    train_id: '',
    shoulder_id: '',
    start_time: dayjs().format('YYYY-MM-DDTHH:mm'),
    end_time: dayjs().add(8, 'hour').format('YYYY-MM-DDTHH:mm'),
    note: ''
  });

  const fetchData = async () => {
    const [a, l, t, s] = await Promise.all([
      api.getAssignments(),
      api.getLocomotives(),
      api.getTrains(),
      api.getShoulders()
    ]);
    setAssignments(a);
    setLocomotives(l);
    setTrains(t);
    setShoulders(s);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleShoulderChange = (shoulderId: string) => {
    setFormData({ ...formData, shoulder_id: shoulderId, locomotive_id: '' });
    if (shoulderId) {
      api.getRecommendations(parseInt(shoulderId)).then(setRecommendations);
    } else {
      setRecommendations([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createAssignment({
        ...formData,
        locomotive_id: parseInt(formData.locomotive_id),
        train_id: parseInt(formData.train_id),
        shoulder_id: parseInt(formData.shoulder_id)
      });
      
      if (res.status === 'violation') {
        alert(`Предупреждение: ${res.violation_reason}`);
      }
      
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-center bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex items-center space-x-5">
          <div className="w-14 h-14 bg-ktz-blue rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <ClipboardList size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Управление подвязками</h1>
            <p className="text-slate-500 font-medium">Планирование и оптимизация назначений локомотивов</p>
          </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-3 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200 hover:scale-105 transition-all"
        >
          <Plus size={20} />
          <span>Новая подвязка</span>
        </button>
      </div>

      <Card className="p-0 overflow-hidden rounded-3xl border-2 border-slate-100 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Локомотив</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Поезд</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Плечо</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Период</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Статус</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {assignments.map(a => (
                <tr key={a.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                        <TrainIcon size={18} />
                      </div>
                      <span className="font-black text-slate-900">{a.loco_number}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-sm font-bold text-slate-600">{a.train_number}</td>
                  <td className="px-8 py-6 text-sm font-medium text-slate-500">{a.shoulder_name}</td>
                  <td className="px-8 py-6">
                    <div className="text-sm font-black text-slate-900">
                      {dayjs(a.start_time).format('DD.MM HH:mm')}
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      до {dayjs(a.end_time).format('HH:mm')}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <Badge variant={
                      a.status === 'completed' ? 'success' : 
                      a.status === 'active' ? 'info' : 
                      a.status === 'conflict' ? 'danger' : 
                      a.status === 'violation' ? 'warning' : 'default'
                    }>
                      {a.status === 'planned' ? 'Запланировано' : 
                       a.status === 'active' ? 'В пути' : 
                       a.status === 'completed' ? 'Завершено' : 
                       a.status === 'conflict' ? 'Конфликт' : 'Нарушение'}
                    </Badge>
                    {(a.violation_reason || a.conflict_reason) && (
                      <p className="text-[9px] font-bold text-rose-500 mt-2 max-w-[150px] leading-tight uppercase tracking-tighter">{a.violation_reason || a.conflict_reason}</p>
                    )}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="p-2.5 text-slate-400 hover:text-ktz-blue hover:bg-slate-50 rounded-xl transition-all">
                      <Settings size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Создание новой подвязки</h3>
                  <p className="text-sm text-slate-500">Система автоматически проверит ограничения и предложит варианты</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-4">
                    <label className="block">
                      <span className="text-sm font-bold text-slate-700 mb-2 block">Выберите плечо обслуживания</span>
                      <select 
                        required
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-ktz-blue outline-none transition-all"
                        value={formData.shoulder_id}
                        onChange={(e) => handleShoulderChange(e.target.value)}
                      >
                        <option value="">-- Выберите плечо --</option>
                        {shoulders.map(s => (
                          <option key={s.id} value={s.id}>{s.station_a_name} → {s.station_b_name} ({s.distance_km} км)</option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="text-sm font-bold text-slate-700 mb-2 block">Выберите поезд</span>
                      <select 
                        required
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-ktz-blue outline-none transition-all"
                        value={formData.train_id}
                        onChange={(e) => setFormData({ ...formData, train_id: e.target.value })}
                      >
                        <option value="">-- Выберите поезд --</option>
                        {trains.map(t => (
                          <option key={t.id} value={t.id}>{t.number} ({t.category === 'cargo' ? 'Грузовой' : 'Пассажирский'})</option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <label className="block">
                      <span className="text-sm font-bold text-slate-700 mb-2 block">Время начала</span>
                      <input 
                        type="datetime-local" 
                        required
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-ktz-blue outline-none transition-all"
                        value={formData.start_time}
                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-bold text-slate-700 mb-2 block">Время окончания</span>
                      <input 
                        type="datetime-local" 
                        required
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-ktz-blue outline-none transition-all"
                        value={formData.end_time}
                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="text-sm font-bold text-slate-700 mb-2 block">Примечание</span>
                    <textarea 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-ktz-blue outline-none transition-all h-24 resize-none"
                      placeholder="Дополнительная информация..."
                      value={formData.note}
                      onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    ></textarea>
                  </label>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-800 flex items-center space-x-2">
                      <Activity size={18} className="text-ktz-blue" />
                      <span>Рекомендации системы</span>
                    </h4>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Оптимизация по простою</span>
                  </div>

                  <div className="space-y-3">
                    {recommendations.length === 0 ? (
                      <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center">
                        <Search size={32} className="mx-auto text-slate-300 mb-2" />
                        <p className="text-sm text-slate-400">Выберите плечо для получения рекомендаций</p>
                      </div>
                    ) : (
                      recommendations.map((rec, i) => (
                        <div 
                          key={rec.id}
                          onClick={() => setFormData({ ...formData, locomotive_id: rec.id.toString() })}
                          className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden ${
                            formData.locomotive_id === rec.id.toString() 
                              ? 'border-ktz-blue bg-blue-50/50 shadow-md' 
                              : 'border-slate-100 hover:border-slate-200 bg-white'
                          }`}
                        >
                          {i === 0 && (
                            <div className="absolute top-0 right-0 bg-ktz-blue text-white text-[8px] font-bold px-2 py-1 rounded-bl-lg uppercase tracking-widest">
                              Best Match
                            </div>
                          )}
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-bold text-slate-800">{rec.number}</p>
                              <p className="text-[10px] text-slate-500">{rec.model} • {rec.current_station_name}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-ktz-blue">{rec.score}%</p>
                              <p className="text-[10px] text-slate-400">Рейтинг</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 mt-3">
                            <div className="flex items-center space-x-2 text-[10px] text-slate-600">
                              <Fuel size={12} className={rec.fuel_current < rec.required_fuel ? "text-rose-500" : "text-emerald-500"} />
                              <span>{Math.round(rec.fuel_current)}л / {Math.round(rec.required_fuel)}л</span>
                            </div>
                            <div className="flex items-center space-x-2 text-[10px] text-slate-600">
                              <Clock size={12} className={rec.reasons.some((r: string) => r.includes('ТО')) ? "text-rose-500" : "text-slate-400"} />
                              <span>ТО: {Math.round(rec.max_run_hours - rec.run_hours_since_service)}ч ост.</span>
                            </div>
                          </div>

                          {rec.reasons.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {rec.reasons.map((r: string, idx: number) => (
                                <span key={idx} className="text-[8px] bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded font-bold uppercase">{r}</span>
                              ))}
                            </div>
                          )}
                          
                          <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between items-center">
                             <span className="text-[9px] text-slate-400">Стоимость простоя:</span>
                             <span className="text-[10px] font-bold text-slate-700">{rec.idle_cost.toLocaleString()} ₸</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="pt-4">
                    <button 
                      type="submit"
                      disabled={!formData.locomotive_id}
                      className="w-full bg-ktz-blue text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-200 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
                    >
                      Подтвердить подвязку
                    </button>
                  </div>
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
    <div className="flex h-screen bg-ktz-gray overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shadow-xl shadow-slate-200/50 z-50">
        <div className="p-8 flex items-center space-x-4">
          <div className="w-12 h-12 bg-ktz-blue rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200 transform -rotate-3">
            <TrainIcon size={28} />
          </div>
          <div>
            <h1 className="font-bold text-2xl tracking-tight text-slate-900 leading-none">КТЖ</h1>
            <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mt-1">Dispatcher Pro</p>
          </div>
        </div>

        <nav className="flex-1 px-6 space-y-1.5 overflow-y-auto py-4">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 mb-4">Основное</div>
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
          
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 mt-8 mb-4">Операции</div>
          <SidebarItem 
            icon={ClipboardList} 
            label="Подвязки" 
            active={activeTab === 'assignments'} 
            onClick={() => setActiveTab('assignments')} 
          />
          <SidebarItem 
            icon={Activity} 
            label="Локомотивы" 
            active={activeTab === 'locomotives'} 
            onClick={() => setActiveTab('locomotives')} 
          />
          <SidebarItem 
            icon={Map} 
            label="Плечи" 
            active={activeTab === 'shoulders'} 
            onClick={() => setActiveTab('shoulders')} 
          />
          <SidebarItem 
            icon={AlertTriangle} 
            label="Конфликты" 
            active={activeTab === 'conflicts'} 
            onClick={() => setActiveTab('conflicts')} 
          />

          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 mt-8 mb-4">Система</div>
          <SidebarItem 
            icon={TrendingUp} 
            label="Эффективность" 
            active={activeTab === 'efficiency'} 
            onClick={() => setActiveTab('efficiency')} 
          />
          <SidebarItem 
            icon={Plus} 
            label="Импорт данных" 
            active={activeTab === 'import'} 
            onClick={() => setActiveTab('import')} 
          />
          <SidebarItem 
            icon={Settings} 
            label="Настройки" 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
          />
        </nav>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-3 mb-6 p-2 rounded-xl hover:bg-white transition-colors cursor-pointer border border-transparent hover:border-slate-200">
            <div className="w-10 h-10 rounded-xl bg-slate-200 overflow-hidden shadow-sm">
              <img src="https://picsum.photos/seed/user/100/100" alt="Avatar" referrerPolicy="no-referrer" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">Диспетчер А.К.</p>
              <p className="text-[10px] text-slate-500 font-medium">Управление ЦУП</p>
            </div>
          </div>
          <button className="w-full flex items-center justify-center space-x-2 py-3 text-slate-400 font-bold hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all duration-200">
            <LogOut size={18} />
            <span className="text-sm">Выйти из системы</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-slate-50/30">
        <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-40 px-10 py-5 flex justify-between items-center">
          <div className="flex items-center space-x-3 text-sm">
            <span className="text-slate-400 font-medium">Система</span>
            <ChevronRight size={14} className="text-slate-300" />
            <span className="font-bold text-slate-900 capitalize tracking-tight">{activeTab}</span>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-4">
              {apiOnline === false && (
                <div className="flex items-center space-x-2 px-4 py-1.5 bg-rose-50 text-rose-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-rose-100">
                  <AlertTriangle size={14} />
                  <span>API Offline</span>
                  <button 
                    onClick={() => {
                      setApiOnline(null);
                      api.checkHealth()
                        .then(() => setApiOnline(true))
                        .catch(() => setApiOnline(false));
                    }}
                    className="ml-2 hover:underline text-rose-900"
                  >
                    Retry
                  </button>
                </div>
              )}
              {apiOnline === true && (
                <div className="flex items-center space-x-2 px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span>API Online</span>
                </div>
              )}
              <div className="h-4 w-px bg-slate-200"></div>
              <div className="flex items-center space-x-2 text-slate-500">
                <Clock size={16} />
                <span className="text-xs font-bold font-mono">{dayjs().format('HH:mm:ss')}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button className="p-2.5 text-slate-400 hover:text-ktz-blue hover:bg-blue-50 rounded-xl transition-all">
                <Search size={20} />
              </button>
              <button className="p-2.5 text-slate-400 hover:text-ktz-blue hover:bg-blue-50 rounded-xl transition-all">
                <Info size={20} />
              </button>
            </div>
          </div>
        </header>

        <div className="p-10 max-w-[1600px] mx-auto">
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
              {activeTab === 'shoulders' && <ShoulderList />}
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
