import React, { useState } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, LineChart, Line } from 'recharts';
import { Droplet, Flame, Zap, TrendingDown, ArrowUpRight, ArrowDownRight, DownloadCloud, Plus } from 'lucide-react';
import { cn } from '../lib/utils';
import { mockOrders } from '../store/mockData';
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
  { line: 'Line A (Large)', waterPerUnit: 12.5, gasPerUnit: 45.2, efficiency: 85 },
  { line: 'Line B (Small)', waterPerUnit: 8.2, gasPerUnit: 30.1, efficiency: 92 },
  { line: 'Line C (Custom)', waterPerUnit: 18.0, gasPerUnit: 60.5, efficiency: 78 },
];

export default function ResourceAnalytics() {
  const [timeframe, setTimeframe] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');
  const [hourlyData, setHourlyData] = useState(initialHourlyData);
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
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <label className="text-[11px] font-black uppercase tracking-[0.2em] text-orange-500">Analytics</label>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight mt-1 text-white">Resource Usage</h1>
          <p className="text-zinc-400 mt-2 font-medium">Track and optimize water, gas, and power consumption.</p>
        </div>
        <div className="flex gap-4">
          <div className="flex border border-white/20 bg-black p-1">
            {['Daily', 'Weekly', 'Monthly'].map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf as any)}
                className={cn(
                  "px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors",
                  timeframe === tf ? "bg-orange-500 text-black shadow-none" : "text-zinc-500 hover:text-white"
                )}
              >
                {tf}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsAddMetricOpen(true)}
              className="inline-flex items-center justify-center bg-orange-500 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-black hover:bg-orange-600 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Metric
            </button>
            <button 
              onClick={handleExport}
              className="inline-flex items-center justify-center bg-[#111] border border-white/20 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              <DownloadCloud className="h-4 w-4 mr-2" />
              Export Report
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-[#111] border border-blue-500/30">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-blue-500/20 p-3 text-blue-400">
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
        
        <Card className="bg-[#111] border border-amber-500/30">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-amber-500/20 p-3 text-amber-400">
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

        <Card className="bg-[#111] border border-emerald-500/30">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-emerald-500/20 p-3 text-emerald-400">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-black border border-white/10">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
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
                  />
                  <Legend iconType="square" wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 'bold', color: '#a1a1aa' }}/>
                  <Area type="monotone" dataKey="water" stroke="#3b82f6" strokeWidth={3} fillOpacity={0.1} fill="#3b82f6" activeDot={{ r: 4 }} />
                  <Area type="monotone" dataKey="gas" stroke="#f59e0b" strokeWidth={3} fillOpacity={0.1} fill="#f59e0b" activeDot={{ r: 4 }} />
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
                  />
                  <Legend iconType="plainline" wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 'bold', color: '#a1a1aa' }}/>
                  <Line type="stepAfter" dataKey="water" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  <Line type="stepAfter" dataKey="gas" stroke="#f59e0b" strokeWidth={2} dot={false} />
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
          <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
             <div>
               <h2 className="text-lg font-black uppercase text-white">Efficiency Per Production Line</h2>
               <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">Resource / Unit Cost Analysis</p>
             </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {linesData.map((line) => (
                <div key={line.line} className="border border-white/10 bg-[#111] p-6 hover:border-white/30 transition-colors">
                  <h3 className="text-sm font-black uppercase tracking-widest text-zinc-300 mb-4">{line.line}</h3>
                  <div className="space-y-4">
                     <div>
                       <div className="flex justify-between mb-1">
                         <span className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest">Water / Unit</span>
                         <span className="text-xs font-bold text-white">{line.waterPerUnit} Gal</span>
                       </div>
                       <div className="h-1.5 w-full bg-black">
                         <div className="h-full bg-blue-500" style={{ width: `${(line.waterPerUnit / 20) * 100}%` }}></div>
                       </div>
                     </div>
                     <div>
                       <div className="flex justify-between mb-1">
                         <span className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest">Gas / Unit</span>
                         <span className="text-xs font-bold text-white">{line.gasPerUnit} Therms</span>
                       </div>
                       <div className="h-1.5 w-full bg-black">
                         <div className="h-full bg-amber-500" style={{ width: `${(line.gasPerUnit / 80) * 100}%` }}></div>
                       </div>
                     </div>
                     <div className="pt-4 mt-4 border-t border-white/10 flex justify-between items-center">
                        <span className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest">Overall Efficiency</span>
                        <span className={cn(
                          "text-lg font-black",
                          line.efficiency >= 90 ? "text-emerald-400" :
                          line.efficiency >= 80 ? "text-orange-400" : "text-rose-400"
                        )}>{line.efficiency}%</span>
                     </div>
                  </div>
                </div>
             ))}
          </div>
        </CardContent>
      </Card>

      <Modal isOpen={isAddMetricOpen} onClose={() => setIsAddMetricOpen(false)} title="Log Resource Metric">
        <form onSubmit={handleAddMetric} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Hour of Day</label>
            <select 
              value={newMetric.hour}
              onChange={e => setNewMetric({...newMetric, hour: e.target.value})}
              className="w-full px-4 py-3 border border-white/20 bg-black text-white focus:outline-none focus:border-orange-500 transition-colors appearance-none"
            >
              {Array.from({length: 24}).map((_, i) => (
                <option key={i} value={i}>{`${i}:00 - ${i+1}:00`}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Resource Type</label>
            <div className="grid grid-cols-2 gap-4">
              <button 
                type="button"
                onClick={() => setNewMetric({...newMetric, type: 'water'})}
                className={cn("py-3 text-[10px] font-bold uppercase tracking-widest border transition-colors", newMetric.type === 'water' ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' : 'bg-black text-zinc-500 border-white/20 hover:border-white/50')}
              >
                Water
              </button>
              <button 
                type="button"
                onClick={() => setNewMetric({...newMetric, type: 'gas'})}
                className={cn("py-3 text-[10px] font-bold uppercase tracking-widest border transition-colors", newMetric.type === 'gas' ? 'bg-amber-500/20 text-amber-400 border-amber-500/50' : 'bg-black text-zinc-500 border-white/20 hover:border-white/50')}
              >
                Gas
              </button>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Amount</label>
            <input 
              type="number"
              required min="1"
              value={newMetric.value}
              onChange={e => setNewMetric({...newMetric, value: Number(e.target.value)})}
              className="w-full px-4 py-3 border border-white/20 bg-black text-white focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>
          <button 
            type="submit"
            className="w-full bg-orange-500 text-black font-black uppercase tracking-widest py-4 mt-6 hover:bg-orange-600 transition-colors"
          >
            Log Metric
          </button>
        </form>
      </Modal>
    </div>
  );
}
