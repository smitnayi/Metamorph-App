import React, { useState } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, LineChart, Line, Brush } from 'recharts';
import { Droplet, Flame, Zap, TrendingDown, ArrowUpRight, ArrowDownRight, DownloadCloud, Plus } from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import Modal from '../components/ui/Modal';

const initialHourlyData = Array.from({ length: 24 }).map((_, i) => ({
  time: `${i}:00`,
  water: Math.floor(Math.random() * 50) + 10,
  gas: Math.floor(Math.random() * 80) + 20,
}));

// ... rest remains same until weeklyData
const weeklyData = [
  { name: 'Mon', water: 400, gas: 240, orderVolume: 45 },
  { name: 'Tue', water: 300, gas: 139, orderVolume: 50 },
  { name: 'Wed', water: 200, gas: 980, orderVolume: 55 },
  { name: 'Thu', water: 278, gas: 390, orderVolume: 40 },
  { name: 'Fri', water: 189, gas: 480, orderVolume: 35 },
  { name: 'Sat', water: 239, gas: 380, orderVolume: 20 },
  { name: 'Sun', water: 349, gas: 430, orderVolume: 10 },
];

const linesData = [
  { line: 'Line A (Large)', waterPerUnit: 12.5, gasPerUnit: 45.2, efficiency: 85, trend: [78, 80, 82, 85, 84, 85], waterLimit: 20, gasLimit: 80 },
  { line: 'Line B (Small)', waterPerUnit: 8.2, gasPerUnit: 30.1, efficiency: 92, trend: [88, 90, 89, 91, 93, 92], waterLimit: 15, gasLimit: 50 },
  { line: 'Line C (Custom)', waterPerUnit: 18.0, gasPerUnit: 60.5, efficiency: 78, trend: [85, 82, 80, 79, 75, 78], waterLimit: 25, gasLimit: 70 },
];

export default function ResourceAnalytics() {
  const [timeframe, setTimeframe] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');
  const [hourlyData, setHourlyData] = useState(initialHourlyData);
  const [efficiencyThreshold, setEfficiencyThreshold] = useState(80);
  const [isAddMetricOpen, setIsAddMetricOpen] = useState(false);
  
  const [newMetric, setNewMetric] = useState({ hour: '12', type: 'gas', value: 0 });

  const handleExport = () => {
    const dataStr = JSON.stringify({ summary: weeklyData, detailed: hourlyData }, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `resource-report-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Report successfully exported as JSON.');
  };

  const handleAddMetric = (e: React.FormEvent) => {
    e.preventDefault();
    const timeLabel = `${newMetric.hour}:00`;
    setHourlyData(prev => 
      prev.map(item => item.time === timeLabel ? {
        ...item,
        [newMetric.type]: item[newMetric.type as 'gas' | 'water'] + Number(newMetric.value)
      } : item)
    );
    toast.success(`Added ${newMetric.value} units to ${newMetric.type} at ${timeLabel}.`);
    setIsAddMetricOpen(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-8 md:p-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <label className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-orange-500">Analytics</label>
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight mt-1 text-white">Resource Usage</h1>
          <p className="text-zinc-400 mt-2 font-medium text-sm">Track and optimize water, gas, and power consumption.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="flex bg-[#111] border border-white/10 p-1 rounded-xl">
            {['Daily', 'Weekly', 'Monthly'].map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf as any)}
                className={cn(
                  "px-4 py-3 sm:py-2 flex-1 text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-colors rounded-lg",
                  timeframe === tf ? "bg-orange-500 text-black" : "text-zinc-500 hover:text-white"
                )}
              >
                {tf}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsAddMetricOpen(true)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center bg-orange-500 px-4 py-3 sm:py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest text-black hover:bg-orange-600 transition-colors shadow-lg active:scale-95"
            >
              <Plus className="h-4 w-4 mr-0 sm:mr-2" />
              <span className="hidden sm:inline">Add Metric</span>
              <span className="sm:hidden ml-2">Log</span>
            </button>
            <button 
              onClick={handleExport}
              className="flex-1 sm:flex-none inline-flex items-center justify-center bg-[#111] border border-white/10 px-4 py-3 sm:py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest text-zinc-300 hover:text-white hover:bg-white/5 transition-colors active:scale-95"
            >
              <DownloadCloud className="h-4 w-4 mr-0 sm:mr-2" />
              <span className="hidden sm:inline">Export Report</span>
              <span className="sm:hidden ml-2">Export</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <Card className="bg-[#111] border border-blue-500/30 rounded-2xl shadow-xl">
          <CardContent className="p-5 sm:p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-blue-500/20 p-3 text-blue-400 rounded-xl">
                <Droplet className="h-6 w-6" />
              </div>
              <div className="flex items-center text-rose-500 text-sm font-bold">
                <ArrowUpRight className="h-4 w-4 mr-1" /> 12%
              </div>
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-blue-500 mb-1">Water Consumption</div>
            <div className="text-4xl font-black tracking-tight text-white">2,450 <span className="text-sm text-zinc-500 font-bold uppercase">Gal</span></div>
            <p className="text-xs text-zinc-500 mt-4">+250 Gal vs last {timeframe.toLowerCase()}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-[#111] border border-amber-500/30 rounded-2xl shadow-xl">
          <CardContent className="p-5 sm:p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-amber-500/20 p-3 text-amber-400 rounded-xl">
                <Flame className="h-6 w-6" />
              </div>
              <div className="flex items-center text-emerald-500 text-sm font-bold">
                <ArrowDownRight className="h-4 w-4 mr-1" /> 4.2%
              </div>
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-amber-500 mb-1">Gas Usage</div>
            <div className="text-4xl font-black tracking-tight text-white">1,840 <span className="text-sm text-zinc-500 font-bold uppercase">Therms</span></div>
            <p className="text-xs text-zinc-500 mt-4">-80 Therms vs last {timeframe.toLowerCase()}</p>
          </CardContent>
        </Card>

        <Card className="bg-[#111] border border-emerald-500/30 rounded-2xl shadow-xl">
          <CardContent className="p-5 sm:p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-emerald-500/20 p-3 text-emerald-400 rounded-xl">
                <TrendingDown className="h-6 w-6" />
              </div>
              <div className="flex items-center text-emerald-500 text-sm font-bold">
                <ArrowUpRight className="h-4 w-4 mr-1" /> 8.5%
              </div>
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-1">Resource Efficiency Score</div>
            <div className="text-4xl font-black tracking-tight text-white">88<span className="text-sm text-zinc-500 font-bold uppercase">/100</span></div>
            <p className="text-xs text-zinc-500 mt-4">Top 15% across all production lines</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card className="bg-[#111] border border-white/5 rounded-2xl shadow-xl">
          <CardContent className="p-5 md:p-6">
            <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
               <div>
                 <h2 className="text-lg font-black uppercase text-white">Historical Trends</h2>
                 <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">Water vs Gas ({timeframe})</p>
               </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#a1a1aa', fontSize: 10, fontWeight: 'bold'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#a1a1aa', fontSize: 10, fontWeight: 'bold'}} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '0', color: '#fff' }}
                    itemStyle={{ fontSize: '14px', fontWeight: 'bold' }}
                    cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-black/90 backdrop-blur-sm border border-white/20 p-3 shadow-2xl">
                            <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-2">{label}</p>
                            <div className="space-y-1.5">
                              {payload.map((entry: any, index: number) => (
                                 <div key={index} className="flex items-center gap-3 justify-between">
                                   <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{entry.name}</span>
                                   </div>
                                   <span className="text-sm font-black text-white">{entry.value}</span>
                                 </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend iconType="square" wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 'bold', color: '#a1a1aa' }}/>
                  <Brush dataKey="name" height={30} stroke="#f97316" fill="#111" tickFormatter={() => ''} />
                  <Area type="monotone" dataKey="water" stroke="#3b82f6" strokeWidth={3} fillOpacity={0.1} fill="#3b82f6" activeDot={{ r: 6, strokeWidth: 0 }} />
                  <Area type="monotone" dataKey="gas" stroke="#f59e0b" strokeWidth={3} fillOpacity={0.1} fill="#f59e0b" activeDot={{ r: 6, strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black border border-white/10">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
               <div>
                 <h2 className="text-lg font-black uppercase text-white">Real-Time Peak Usage</h2>
                 <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">Today 24H View</p>
               </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hourlyData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#a1a1aa', fontSize: 10, fontWeight: 'bold'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#a1a1aa', fontSize: 10, fontWeight: 'bold'}} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '0', color: '#fff' }}
                    itemStyle={{ fontSize: '14px', fontWeight: 'bold' }}
                    labelStyle={{ color: '#a1a1aa' }}
                    cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-black/90 backdrop-blur-sm border border-white/20 p-3 shadow-2xl">
                            <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-2">{label}</p>
                            <div className="space-y-1.5">
                              {payload.map((entry: any, index: number) => (
                                 <div key={index} className="flex items-center gap-3 justify-between">
                                   <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{entry.name}</span>
                                   </div>
                                   <span className="text-sm font-black text-white">{entry.value}</span>
                                 </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend iconType="plainline" wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 'bold', color: '#a1a1aa' }}/>
                  <Brush dataKey="time" height={30} stroke="#f97316" fill="#111" tickFormatter={() => ''} />
                  <Line type="stepAfter" dataKey="water" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
                  <Line type="stepAfter" dataKey="gas" stroke="#f59e0b" strokeWidth={2} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex gap-4 p-4 bg-[#111] border border-rose-500/30">
               <Zap className="h-5 w-5 text-rose-500 flex-shrink-0" />
               <p className="text-sm font-bold text-rose-100">Peak gas usage detected between 13:00 and 15:00. Recommend staggering Oven 1 and Oven 2 batches to reduce 15% peak load penalty.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-black border border-white/10">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-6 border-b border-white/10 pb-4 gap-4">
             <div>
               <h2 className="text-lg font-black uppercase text-white">Efficiency Per Production Line</h2>
               <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">Resource / Unit Cost Analysis</p>
             </div>
             <div className="flex items-center gap-3">
               <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Alert Threshold</label>
               <div className="flex items-center bg-black border border-white/20 px-3 py-2 focus-within:border-orange-500 transition-colors">
                 <input 
                   type="number" 
                   value={efficiencyThreshold} 
                   onChange={(e) => setEfficiencyThreshold(Number(e.target.value))}
                   className="w-12 bg-transparent text-white text-sm font-black focus:outline-none text-right"
                   min="0" max="100"
                 />
                 <span className="text-zinc-500 font-bold ml-1 text-sm">%</span>
               </div>
             </div>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
             {linesData.map((line) => (
                <div key={line.line} className={cn(
                  "border p-5 transition-all group relative overflow-hidden",
                  line.efficiency < efficiencyThreshold 
                    ? "border-rose-500/50 bg-rose-500/5 hover:border-rose-500" 
                    : "border-white/10 bg-[#111] hover:border-white/30"
                )}>
                  {line.efficiency < efficiencyThreshold && (
                    <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none z-10 overflow-hidden">
                       <div className="absolute transform rotate-45 bg-rose-500 text-black text-[8px] font-black uppercase tracking-widest py-1 right-[-35px] top-[15px] w-[120px] text-center shadow-lg">
                         Critical Fall
                       </div>
                    </div>
                  )}
                  <div className="flex justify-between items-start mb-5 relative z-10">
                    <h3 className="text-sm font-black uppercase tracking-widest text-zinc-300 group-hover:text-white transition-colors">{line.line}</h3>
                    <div className="bg-black border border-white/10 px-2 py-1 flex items-center gap-2" title="Efficiency Trend (last 6 hours)">
                      <div className="h-6 w-16 opacity-70 group-hover:opacity-100 transition-opacity">
                         <ResponsiveContainer width="100%" height="100%">
                           <LineChart data={line.trend.map((v, i) => ({ value: v, index: i }))}>
                             <Tooltip 
                               content={({ active, payload }) => {
                                 if (active && payload && payload.length) {
                                   return (
                                     <div className="bg-black border border-white/20 px-2 py-1 text-[10px] font-bold text-white z-50">
                                       {payload[0].value}%
                                     </div>
                                   );
                                 }
                                 return null;
                               }}
                               cursor={false}
                             />
                             <Line type="monotone" dataKey="value" stroke={line.trend[line.trend.length - 1] >= line.trend[0] ? "#10b981" : "#f43f5e"} strokeWidth={2} dot={false} isAnimationActive={false} />
                           </LineChart>
                         </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                     <div className="relative group/tooltip">
                       <div className="flex justify-between items-end mb-1">
                         <div className="flex items-center gap-1.5">
                           <Droplet className="h-3.5 w-3.5 text-blue-500" />
                           <span className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest">Water / Unit</span>
                         </div>
                         <div className="text-right">
                           <span className="text-sm font-black text-white">{line.waterPerUnit}</span>
                           <span className="text-[9px] font-bold uppercase text-zinc-500 tracking-widest ml-1">Gal</span>
                         </div>
                       </div>
                       <div className="h-1.5 w-full bg-black/50 overflow-hidden relative">
                         <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${(line.waterPerUnit / line.waterLimit) * 100}%` }}></div>
                         <div className="absolute top-0 bottom-0 right-0 w-0.5 bg-rose-500/50" style={{ right: '0%' }}></div>
                       </div>
                       {/* Tooltip content */}
                       <div className="absolute left-0 bottom-full mb-2 w-full opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-opacity bg-black border border-white/20 p-2 z-10 shadow-2xl">
                          <p className="text-[10px] font-bold uppercase text-zinc-300">Target Limit: {line.waterLimit} Gal</p>
                          <p className="text-[9px] font-bold text-zinc-500 mt-0.5">{((line.waterPerUnit/line.waterLimit)*100).toFixed(0)}% of target consumed per unit</p>
                       </div>
                     </div>
                     <div className="relative group/tooltip">
                       <div className="flex justify-between items-end mb-1 mt-1">
                         <div className="flex items-center gap-1.5">
                           <Flame className="h-3.5 w-3.5 text-amber-500" />
                           <span className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest">Gas / Unit</span>
                         </div>
                         <div className="text-right">
                           <span className="text-sm font-black text-white">{line.gasPerUnit}</span>
                           <span className="text-[9px] font-bold uppercase text-zinc-500 tracking-widest ml-1">Therms</span>
                         </div>
                       </div>
                       <div className="h-1.5 w-full bg-black/50 overflow-hidden relative">
                         <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${(line.gasPerUnit / line.gasLimit) * 100}%` }}></div>
                         <div className="absolute top-0 bottom-0 right-0 w-0.5 bg-rose-500/50" style={{ right: '0%' }}></div>
                       </div>
                       {/* Tooltip content */}
                       <div className="absolute left-0 bottom-full mb-2 w-full opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-opacity bg-black border border-white/20 p-2 z-10 shadow-2xl">
                          <p className="text-[10px] font-bold uppercase text-zinc-300">Target Limit: {line.gasLimit} Therms</p>
                          <p className="text-[9px] font-bold text-zinc-500 mt-0.5">{((line.gasPerUnit/line.gasLimit)*100).toFixed(0)}% of target consumed per unit</p>
                       </div>
                     </div>
                     <div className="pt-4 mt-5 border-t border-white/10 flex justify-between items-center">
                        <span className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest">Overall Efficiency</span>
                        <div className="flex items-center gap-2">
                           {line.trend[line.trend.length - 1] > line.trend[line.trend.length - 2] ? (
                             <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                           ) : (
                             <ArrowDownRight className="h-3 w-3 text-rose-500" /> 
                           )}
                           <span className={cn(
                             "text-lg font-black",
                             line.efficiency >= 90 ? "text-emerald-400" :
                             line.efficiency >= 80 ? "text-orange-400" : "text-rose-400"
                           )}>{line.efficiency}%</span>
                        </div>
                     </div>
                  </div>
                </div>
             ))}
          </div>
        </CardContent>
      </Card>

      <Modal isOpen={isAddMetricOpen} onClose={() => setIsAddMetricOpen(false)} title="Log Resource Metric">
        <form onSubmit={handleAddMetric} className="space-y-5">
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Hour of Day</label>
            <select 
              value={newMetric.hour}
              onChange={e => setNewMetric({...newMetric, hour: e.target.value})}
              className="w-full px-4 py-4 rounded-xl border border-white/10 bg-black text-white focus:outline-none focus:border-orange-500 transition-colors appearance-none font-medium"
            >
              {Array.from({length: 24}).map((_, i) => (
                <option key={i} value={i}>{`${i}:00 - ${i+1}:00`}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Resource Type</label>
            <div className="grid grid-cols-2 gap-4">
              <button 
                type="button"
                onClick={() => setNewMetric({...newMetric, type: 'water'})}
                className={cn("py-4 text-[10px] sm:text-xs font-bold uppercase tracking-widest border rounded-xl transition-colors shadow-lg active:scale-95", newMetric.type === 'water' ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' : 'bg-black text-zinc-500 border-white/10 hover:border-white/50')}
              >
                Water
              </button>
              <button 
                type="button"
                onClick={() => setNewMetric({...newMetric, type: 'gas'})}
                className={cn("py-4 text-[10px] sm:text-xs font-bold uppercase tracking-widest border rounded-xl transition-colors shadow-lg active:scale-95", newMetric.type === 'gas' ? 'bg-amber-500/20 text-amber-400 border-amber-500/50' : 'bg-black text-zinc-500 border-white/10 hover:border-white/50')}
              >
                Gas
              </button>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Amount</label>
            <input 
              type="number"
              required min="1"
              value={newMetric.value}
              onChange={e => setNewMetric({...newMetric, value: Number(e.target.value)})}
              className="w-full px-4 py-4 rounded-xl border border-white/10 bg-black text-white focus:outline-none focus:border-orange-500 transition-colors font-medium"
            />
          </div>
          <button 
            type="submit"
            className="w-full bg-orange-500 text-black font-black uppercase tracking-widest py-4 rounded-xl mt-4 hover:bg-orange-600 transition-colors shadow-lg active:scale-[0.98]"
          >
            Log Metric
          </button>
        </form>
      </Modal>
    </div>
  );
}
