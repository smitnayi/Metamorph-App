import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { mockOrders, mockTasks } from '../store/mockData';

const usageData = [
  { name: 'Mon', water: 4000, gas: 2400 },
  { name: 'Tue', water: 3000, gas: 1398 },
  { name: 'Wed', water: 2000, gas: 9800 },
  { name: 'Thu', water: 2780, gas: 3908 },
  { name: 'Fri', water: 1890, gas: 4800 },
  { name: 'Sat', water: 2390, gas: 3800 },
  { name: 'Sun', water: 3490, gas: 4300 },
];

export default function Dashboard() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <div className="animate-pulse space-y-6 max-w-7xl mx-auto p-4 md:p-8">
      <div className="h-12 bg-white/10 w-64 mb-8"></div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {[1,2,3,4].map(i => <div key={i} className="h-32 bg-white/5"></div>)}
      </div>
    </div>;
  }

  const activeOrders = mockOrders.filter(o => o.status !== 'Delivered').length;
  const pendingTasks = mockTasks.filter(t => t.status !== 'Done').length;

  return (
    <div className="flex flex-col lg:flex-row h-full">
      <section className="flex-1 lg:w-7/12 border-b lg:border-b-0 lg:border-r border-white/10 p-4 sm:p-6 md:p-8 flex flex-col justify-between">
        <div>
          <label className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-orange-500">Operational Pulse</label>
          <div className="text-[60px] sm:text-[80px] lg:text-[140px] font-black leading-none tracking-tighter -ml-1 mt-2 text-white">94.8%</div>
          <p className="text-zinc-400 text-sm md:text-base font-medium max-w-md mt-4">Line performance is optimal. Oven 2 stable at 405°F. 12 orders dispatched today.</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-6 md:gap-8 mt-8 md:mt-12 mb-4 md:mb-8">
          <div className="bg-[#111] p-4 sm:p-5 rounded-2xl border border-white/5">
            <label className="text-[9px] sm:text-[10px] font-bold uppercase text-zinc-500 tracking-widest">Active Orders</label>
            <div className="text-3xl sm:text-4xl font-black mt-2 text-white">{activeOrders} <span className="text-xs sm:text-sm font-normal text-emerald-400">+12%</span></div>
          </div>
          <div className="bg-[#111] p-4 sm:p-5 rounded-2xl border border-white/5">
            <label className="text-[9px] sm:text-[10px] font-bold uppercase text-zinc-500 tracking-widest">Pending Tasks</label>
            <div className="text-3xl sm:text-4xl font-black mt-2 text-white">{pendingTasks} <span className="text-xs sm:text-sm font-normal text-zinc-400">Hi: {mockTasks.filter(t => t.priority === 'High').length}</span></div>
          </div>
          <div className="bg-[#111] p-4 sm:p-5 rounded-2xl border border-white/5">
            <label className="text-[9px] sm:text-[10px] font-bold uppercase text-zinc-500 tracking-widest">Pass Rate</label>
            <div className="text-3xl sm:text-4xl font-black mt-2 text-white">96.8% <span className="text-xs sm:text-sm font-normal text-emerald-400">&gt;95%</span></div>
          </div>
          <div className="bg-[#111] p-4 sm:p-5 rounded-2xl border border-white/5">
            <label className="text-[9px] sm:text-[10px] font-bold uppercase text-zinc-500 tracking-widest">Stock Alerts</label>
            <div className="text-3xl sm:text-4xl font-black mt-2 text-white">3 <span className="text-xs sm:text-sm font-normal text-rose-500">Crit</span></div>
          </div>
        </div>
      </section>

      <section className="flex-1 lg:w-5/12 flex flex-col bg-[#0a0a0a]">
        <div className="p-4 sm:p-6 md:p-8 border-b border-white/5">
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white">Resource Flow</h2>
            <div className="text-[9px] sm:text-[10px] font-bold border border-white/10 rounded-lg px-2 sm:px-3 py-1 uppercase text-zinc-400 bg-white/5">Last 7 Days</div>
          </div>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={usageData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#a1a1aa', fontSize: 10, fontWeight: 'bold'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#a1a1aa', fontSize: 10, fontWeight: 'bold'}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '0', color: '#fff' }}
                  itemStyle={{ fontSize: '14px', fontWeight: 'bold' }}
                />
                <Legend iconType="square" wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 'bold', color: '#a1a1aa' }}/>
                <Area type="step" dataKey="water" stroke="#3b82f6" strokeWidth={3} fillOpacity={0.1} fill="#3b82f6" activeDot={{ r: 0 }} />
                <Area type="step" dataKey="gas" stroke="#f59e0b" strokeWidth={3} fillOpacity={0.1} fill="#f59e0b" activeDot={{ r: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex-1 p-6 md:p-8">
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] mb-6 text-zinc-500">Pipeline Volume</h2>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { stage: 'Pending', count: 12 },
                { stage: 'Prepping', count: 8 },
                { stage: 'Coating', count: 15 },
                { stage: 'Baking', count: 10 },
                { stage: 'QA', count: 5 }
              ]} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                <XAxis dataKey="stage" axisLine={false} tickLine={false} tick={{fill: '#a1a1aa', fontSize: 10, fontWeight: 'bold'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#a1a1aa', fontSize: 10, fontWeight: 'bold'}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '0' }}
                  cursor={{fill: '#222'}}
                />
                <Bar dataKey="count" fill="#ea580c" barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  );
}
