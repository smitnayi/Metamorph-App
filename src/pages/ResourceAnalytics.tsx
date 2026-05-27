import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, LineChart, Line, Brush } from 'recharts';
import { CheckCircle2, TrendingUp, AlertTriangle, ArrowUpRight, ArrowDownRight, DownloadCloud, Plus } from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { useDataStore } from '../store/data';

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ResourceAnalytics() {
  const [timeframe, setTimeframe] = useState<'Daily' | 'Weekly' | 'Monthly'>('Weekly');
  const { orders, tasks, qualityChecks } = useDataStore();

  const { weeklyData, orderStats, qaStats, taskStats } = useMemo(() => {
    // Generate last 7 days data
    const map = new Map();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = daysOfWeek[d.getDay()];
      map.set(dayName, { name: dayName, newOrders: 0, completedOrders: 0, tasksDone: 0 });
    }

    let totalVal = 0;
    
    orders.forEach(o => {
      totalVal += o.totalValue || 0;
      if (o.dueDate) {
        const d = new Date(o.dueDate);
        const dayName = daysOfWeek[d.getDay()];
        if (map.has(dayName)) {
           if (o.status === 'Completed' || o.status === 'Shipped') map.get(dayName).completedOrders++;
           else map.get(dayName).newOrders++;
        }
      }
    });

    tasks.forEach(t => {
      if (t.status === 'Done') {
        const d = new Date(t.dueDate || new Date());
        const dayName = daysOfWeek[d.getDay()];
        if (map.has(dayName)) {
           map.get(dayName).tasksDone++;
        }
      }
    });

    const weeklyData = Array.from(map.values());

    const completed = orders.filter(o => o.status === 'Completed' || o.status === 'Shipped').length;
    const orderStats = {
      total: orders.length,
      revenue: totalVal,
      completionRate: orders.length > 0 ? ((completed / orders.length) * 100).toFixed(0) : 0
    };

    const passedChecks = qualityChecks.filter(q => q.overallResult === 'Pass').length;
    const qaStats = {
      total: qualityChecks.length,
      passRate: qualityChecks.length > 0 ? ((passedChecks / qualityChecks.length) * 100).toFixed(0) : 0
    };

    const doneTasks = tasks.filter(t => t.status === 'Done').length;
    const taskStats = {
      total: tasks.length,
      completionRate: tasks.length > 0 ? ((doneTasks / tasks.length) * 100).toFixed(0) : 0
    };

    return { weeklyData, orderStats, qaStats, taskStats };
  }, [orders, tasks, qualityChecks]);

  const handleExport = () => {
    let csvContent = "Metric,Value\n";
    csvContent += `Total Orders,${orderStats.total}\n`;
    csvContent += `Total Revenue,${orderStats.revenue}\n`;
    csvContent += `Total Products,${orderStats.items}\n`;
    csvContent += `Tasks Total,${taskStats.total}\n`;
    csvContent += `Tasks Completion %,${taskStats.completionRate}\n`;
    csvContent += `QA Issues Recorded,${qaStats.issues}\n\n`;
    
    csvContent += "Daily Breakdown\n";
    csvContent += "Day,Orders,Completed,Tasks Done\n";
    weeklyData.forEach(day => {
      csvContent += `${day.name},${day.orders},${day.completed},${day.tasksDone}\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Report successfully exported as CSV.');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-8 md:p-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <label className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-orange-500">Analytics</label>
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight mt-1 text-zinc-900 dark:text-white">Business Intelligence</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2 font-medium text-sm">Real-time performance metrics and historical trends.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="flex bg-[#f4f4f5] dark:bg-[#111] border border-black/5 dark:border-white/10 p-1 rounded-xl">
            {['Daily', 'Weekly', 'Monthly'].map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf as any)}
                className={cn(
                  "px-4 py-3 sm:py-2 flex-1 text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-colors rounded-lg",
                  timeframe === tf ? "bg-orange-500 text-black" : "text-zinc-500 hover:text-zinc-900 dark:text-white"
                )}
              >
                {tf}
              </button>
            ))}
          </div>
          <button 
            onClick={handleExport}
            className="flex-1 sm:flex-none inline-flex items-center justify-center bg-[#f4f4f5] dark:bg-[#111] border border-black/5 dark:border-white/10 px-4 py-3 sm:py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:text-white hover:bg-black/5 dark:bg-white/5 transition-colors active:scale-95"
          >
            <DownloadCloud className="h-4 w-4 mr-0 sm:mr-2" />
            <span className="hidden sm:inline">Export Report</span>
            <span className="sm:hidden ml-2">Export</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <Card className="bg-[#f4f4f5] dark:bg-[#111] border border-blue-500/30 rounded-2xl shadow-xl">
          <CardContent className="p-5 sm:p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-blue-500/20 p-3 text-blue-400 rounded-xl">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div className={cn("flex items-center text-sm font-bold", orderStats.completionRate > 50 ? 'text-emerald-500' : 'text-rose-500')}>
                {orderStats.completionRate > 50 ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <ArrowDownRight className="h-4 w-4 mr-1" />}
                {orderStats.completionRate}% Done
              </div>
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-blue-500 mb-1">Total Order Revenue</div>
            <div className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white">₹{orderStats.revenue.toLocaleString()}</div>
            <p className="text-xs text-zinc-500 mt-4 tracking-wider uppercase font-bold">{orderStats.total} Total Orders</p>
          </CardContent>
        </Card>
        
        <Card className="bg-[#f4f4f5] dark:bg-[#111] border border-amber-500/30 rounded-2xl shadow-xl">
          <CardContent className="p-5 sm:p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-amber-500/20 p-3 text-amber-400 rounded-xl">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="flex items-center text-amber-500 text-sm font-bold">
                 {qaStats.total} Checks
              </div>
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-amber-500 mb-1">QA Pass Rate</div>
            <div className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white">{qaStats.passRate}<span className="text-sm text-zinc-500 font-bold uppercase">%</span></div>
            <p className="text-xs text-zinc-500 mt-4 tracking-wider uppercase font-bold">Overall Quality Score</p>
          </CardContent>
        </Card>

        <Card className="bg-[#f4f4f5] dark:bg-[#111] border border-emerald-500/30 rounded-2xl shadow-xl">
          <CardContent className="p-5 sm:p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-emerald-500/20 p-3 text-emerald-400 rounded-xl">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className={cn("flex items-center text-sm font-bold", taskStats.completionRate > 50 ? 'text-emerald-500' : 'text-rose-500')}>
                {taskStats.completionRate > 50 ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <ArrowDownRight className="h-4 w-4 mr-1" />}
                {taskStats.completionRate}%
              </div>
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-1">Task Completion Score</div>
            <div className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white">{taskStats.completionRate}<span className="text-sm text-zinc-500 font-bold uppercase">/100</span></div>
            <p className="text-xs text-zinc-500 mt-4 tracking-wider uppercase font-bold">{taskStats.total} Total Workflow Tasks</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:gap-6 mt-6">
        <Card className="bg-[#f4f4f5] dark:bg-[#111] border border-black/5 dark:border-white/5 rounded-2xl shadow-xl">
          <CardContent className="p-5 md:p-6">
            <div className="flex justify-between items-center mb-6 border-b border-black/5 dark:border-white/5 pb-4">
               <div>
                 <h2 className="text-lg font-black uppercase text-zinc-900 dark:text-white">Historical Trends</h2>
                 <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">Orders vs Completed vs Tasks</p>
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
                          <div className="bg-white dark:bg-black/90 backdrop-blur-sm border border-black/10 dark:border-white/20 p-3 shadow-2xl">
                            <p className="text-zinc-600 dark:text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-2">{label}</p>
                            <div className="space-y-1.5">
                              {payload.map((entry: any, index: number) => (
                                 <div key={index} className="flex items-center gap-3 justify-between">
                                   <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{entry.name}</span>
                                   </div>
                                   <span className="text-sm font-black text-zinc-900 dark:text-white">{entry.value}</span>
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
                  <Area name="Due Orders" type="monotone" dataKey="newOrders" stroke="#3b82f6" strokeWidth={3} fillOpacity={0.1} fill="#3b82f6" activeDot={{ r: 6, strokeWidth: 0 }} />
                  <Area name="Completed Orders" type="monotone" dataKey="completedOrders" stroke="#10b981" strokeWidth={3} fillOpacity={0.1} fill="#10b981" activeDot={{ r: 6, strokeWidth: 0 }} />
                  <Area name="Done Tasks" type="monotone" dataKey="tasksDone" stroke="#f59e0b" strokeWidth={3} fillOpacity={0.1} fill="#f59e0b" activeDot={{ r: 6, strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
