import React, { useEffect, useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { useDataStore } from '../store/data';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Order } from '../types';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  }
};

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const { orders, tasks, qualityChecks, inventory, users } = useDataStore();

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const { activeOrders, pendingTasks, passRate, stockAlerts, pipelineData, activityData, overallEfficiency, firstPassYieldData, qaPerEmployee } = useMemo(() => {
    const activeOrders = orders.filter(o => o.status !== 'Completed' && o.status !== 'Shipped').length;
    const pendingTasks = tasks.filter(t => t.status !== 'Done').length;
    
    let passed = 0;
    qualityChecks.forEach(q => {
      if (q.overallResult === 'Pass') passed++;
    });
    const passRate = qualityChecks.length > 0 ? ((passed / qualityChecks.length) * 100).toFixed(1) + '%' : 'N/A';
    
    const stockAlerts = inventory.filter(i => i.weightKg <= i.lowStockThreshold).length;

    const stages = ['Quoted', 'In Progress', 'Quality Check', 'Shipped', 'Completed'];
    const pipelineData = stages.map(stage => ({
      stage,
      count: orders.filter(o => o.status === stage).length
    }));

    // Generate last 30 days for First-Pass Yield
    const fpyMap = new Map<string, { date: string; passed: number; failed: number }>();
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = `${d.getMonth() + 1}/${d.getDate()}`;
      fpyMap.set(dayStr, { date: dayStr, passed: 0, failed: 0 });
    }

    qualityChecks.forEach(q => {
      if (q.date) {
         const d = new Date(q.date);
         const dayStr = `${d.getMonth() + 1}/${d.getDate()}`;
         if (fpyMap.has(dayStr)) {
            if (q.overallResult === 'Pass') fpyMap.get(dayStr)!.passed++;
            else fpyMap.get(dayStr)!.failed++;
         }
      }
    });

    const firstPassYieldData = Array.from(fpyMap.values());

    // Completed vs Rejected per employee
    const employeeQaMap = new Map<string, { name: string; completed: number; rejected: number }>();
    qualityChecks.forEach(q => {
      if (q.inspectorId) {
        const inspectorUser = users.find(u => u.id === q.inspectorId);
        const inspectorName = inspectorUser?.name || 'Unknown';
        if (!employeeQaMap.has(q.inspectorId)) {
           employeeQaMap.set(q.inspectorId, { name: inspectorName, completed: 0, rejected: 0 });
        }
        if (q.overallResult === 'Pass') employeeQaMap.get(q.inspectorId)!.completed++;
        else employeeQaMap.get(q.inspectorId)!.rejected++;
      }
    });

    const qaPerEmployee = Array.from(employeeQaMap.values()).slice(0, 10); // top 10

    const activityMap = new Map<string, { name: string, orders: number, tasks: number }>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = daysOfWeek[d.getDay()];
      activityMap.set(dayName, { name: dayName, orders: 0, tasks: 0 });
    }

    orders.forEach(o => {
      if (o.dueDate) {
        const d = new Date(o.dueDate);
        const dayName = daysOfWeek[d.getDay()];
        if (activityMap.has(dayName)) {
           activityMap.get(dayName)!.orders++;
        }
      }
    });

    tasks.forEach(t => {
      if (t.dueDate) {
        const d = new Date(t.dueDate);
        const dayName = daysOfWeek[d.getDay()];
        if (activityMap.has(dayName)) {
           activityMap.get(dayName)!.tasks++;
        }
      }
    });

    const activityData = Array.from(activityMap.values());
    
    // A simple overall efficiency calculation
    const totalCurrentOrders = orders.length || 1;
    const completedOrders = orders.filter(o => o.status === 'Completed').length;
    const eff = orders.length === 0 ? 0 : Math.round((completedOrders / totalCurrentOrders) * 100);

    return {
      activeOrders, pendingTasks, passRate, stockAlerts, pipelineData, activityData, overallEfficiency: eff + '%', firstPassYieldData, qaPerEmployee
    };
  }, [orders, tasks, qualityChecks, inventory]);

  if (loading) {
    return (
      <div className="flex flex-col lg:flex-row h-full">
        <section className="flex-1 lg:w-7/12 p-4 sm:p-6 md:p-8 flex flex-col justify-between">
          <div>
            <div className="h-4 w-32 bg-black/5 dark:bg-white/5 rounded-md animate-pulse mb-4" />
            <div className="h-24 sm:h-32 w-64 bg-black/5 dark:bg-white/5 rounded-2xl animate-pulse" />
            <div className="h-4 w-48 bg-black/5 dark:bg-white/5 rounded-md animate-pulse mt-6" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-6 md:gap-8 mt-8 md:mt-12 mb-4 md:mb-8">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-32 bg-black/5 dark:bg-white/5 rounded-3xl animate-pulse" />
            ))}
          </div>
        </section>
        <section className="flex-1 lg:w-5/12 p-4 sm:p-6 md:p-8 border-l border-black/5 dark:border-white/5">
          <div className="h-64 bg-black/5 dark:bg-white/5 rounded-3xl animate-pulse mb-8" />
          <div className="h-48 bg-black/5 dark:bg-white/5 rounded-3xl animate-pulse" />
        </section>
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="flex flex-col lg:flex-row h-full">
      <section className="flex-1 lg:w-7/12 border-b lg:border-b-0 lg:border-r border-black/5 dark:border-white/10 p-4 sm:p-6 md:p-8 flex flex-col justify-between relative overflow-hidden">
        <motion.div variants={itemVariants}>
          <label className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-orange-500">Operational Pulse</label>
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
            className="text-[60px] sm:text-[80px] lg:text-[140px] font-black leading-none tracking-tighter -ml-1 mt-2 text-zinc-900 dark:text-white"
          >
            {overallEfficiency}
          </motion.div>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm md:text-base font-medium max-w-md mt-4">Order completion efficiency over current total orders. Real-time updates active.</p>
        </motion.div>

        <motion.div variants={containerVariants} className="grid grid-cols-2 gap-3 sm:gap-6 md:gap-8 mt-8 md:mt-12 mb-4 md:mb-8">
          {[
            { label: 'Active Orders', value: activeOrders, sub: 'In Progress', subColor: 'text-emerald-500' },
            { label: 'Pending Tasks', value: pendingTasks, sub: `High Priority: ${tasks.filter(t => t.priority === 'High').length}`, subColor: 'text-zinc-500' },
            { label: 'Pass Rate', value: passRate, sub: 'QA Checks', subColor: 'text-emerald-500' },
            { label: 'Stock Alerts', value: stockAlerts.toString(), sub: 'Low inventory', subColor: 'text-rose-500' }
          ].map((stat, i) => (
            <motion.div 
              key={i}
              variants={itemVariants}
              whileHover={{ scale: 1.02, y: -4 }}
              className="bg-white/60 dark:bg-black/40 backdrop-blur-2xl p-4 sm:p-5 rounded-[24px] border border-black/[0.04] dark:border-white/[0.06] shadow-[0_8px_40px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_40px_rgba(0,0,0,0.08)] transition-all cursor-default"
            >
              <label className="text-[9px] sm:text-[10px] font-bold uppercase text-zinc-500 tracking-widest">{stat.label}</label>
              <div className="text-3xl sm:text-4xl font-black mt-2 text-zinc-900 dark:text-white">
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 + i*0.1 }}>{stat.value}</motion.span>{' '}
                <span className={cn("text-xs sm:text-sm font-normal", stat.subColor)}>{stat.sub}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* --- New QA Metrics Area --- */}
        <motion.div variants={itemVariants} className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-8">
          
          <div className="bg-white/40 dark:bg-black/20 backdrop-blur-xl p-4 sm:p-6 rounded-[24px] border border-black/[0.04] dark:border-white/[0.06] shadow-sm flex flex-col">
            <div className="flex justify-between items-end mb-4">
              <h3 className="text-sm font-black uppercase text-zinc-900 dark:text-white">First-Pass Yield</h3>
              <div className="text-[9px] font-bold border border-black/5 dark:border-white/10 rounded-lg px-2 py-1 uppercase text-zinc-500">30 Days</div>
            </div>
            <div className="h-[140px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={firstPassYieldData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150,150,150,0.1)" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#a1a1aa', fontSize: 9, fontWeight: 'bold'}} dy={5} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#a1a1aa', fontSize: 9, fontWeight: 'bold'}} />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                  <Area type="monotone" name="Passed" dataKey="passed" stroke="#10b981" strokeWidth={2} fillOpacity={0.1} fill="#10b981" />
                  <Area type="monotone" name="Failed" dataKey="failed" stroke="#f43f5e" strokeWidth={2} fillOpacity={0.1} fill="#f43f5e" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white/40 dark:bg-black/20 backdrop-blur-xl p-4 sm:p-6 rounded-[24px] border border-black/[0.04] dark:border-white/[0.06] shadow-sm flex flex-col">
            <div className="flex justify-between items-end mb-4">
              <h3 className="text-sm font-black uppercase text-zinc-900 dark:text-white">Inspector QA</h3>
              <div className="text-[9px] font-bold border border-black/5 dark:border-white/10 rounded-lg px-2 py-1 uppercase text-zinc-500">Top 10</div>
            </div>
            <div className="h-[140px] w-full mt-auto">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={qaPerEmployee} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150,150,150,0.1)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#a1a1aa', fontSize: 9, fontWeight: 'bold'}} dy={5} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#a1a1aa', fontSize: 9, fontWeight: 'bold'}} />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px' }} cursor={{ fill: 'rgba(150,150,150,0.05)' }} />
                  <Bar dataKey="completed" name="Pass" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} barSize={16} />
                  <Bar dataKey="rejected" name="Fail" stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
        </motion.div>
      </section>

      <section className="flex-1 lg:w-5/12 flex flex-col bg-transparent">
        <motion.div variants={itemVariants} className="p-4 sm:p-6 md:p-8 border-b border-black/5 dark:border-white/5">
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-zinc-900 dark:text-white">Activity Overview</h2>
            <div className="text-[9px] sm:text-[10px] font-bold border border-black/5 dark:border-white/10 rounded-xl px-2 sm:px-3 py-1 uppercase text-zinc-600 dark:text-zinc-400 bg-white/50 dark:bg-white/5 backdrop-blur-sm shadow-sm">Last 7 Days</div>
          </div>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150,150,150,0.1)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#a1a1aa', fontSize: 10, fontWeight: 'bold'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#a1a1aa', fontSize: 10, fontWeight: 'bold'}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: '#fff', backdropFilter: 'blur(8px)' }}
                  itemStyle={{ fontSize: '14px', fontWeight: 'bold' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 'bold', color: '#a1a1aa' }}/>
                <Area type="monotone" name="Due Orders" dataKey="orders" stroke="#3b82f6" strokeWidth={3} fillOpacity={0.1} fill="url(#colorOrders)" activeDot={{ r: 6, strokeWidth: 0 }} />
                <Area type="monotone" name="Due Tasks" dataKey="tasks" stroke="#f59e0b" strokeWidth={3} fillOpacity={0.1} fill="url(#colorTasks)" activeDot={{ r: 6, strokeWidth: 0 }} />
                <defs>
                  <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="flex-1 p-6 md:p-8">
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] mb-6 text-zinc-500">Pipeline Volume</h2>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150,150,150,0.1)" />
                <XAxis dataKey="stage" axisLine={false} tickLine={false} tick={{fill: '#a1a1aa', fontSize: 10, fontWeight: 'bold'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#a1a1aa', fontSize: 10, fontWeight: 'bold'}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', backdropFilter: 'blur(8px)' }}
                  cursor={{fill: 'rgba(150,150,150,0.1)'}}
                />
                <Bar dataKey="count" name="Orders" fill="#ea580c" radius={[6, 6, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* --- Activity Feed Area --- */}
        <motion.div variants={itemVariants} className="flex-1 p-4 sm:p-6 md:p-8 border-t border-black/5 dark:border-white/5 bg-white/40 dark:bg-black/20 backdrop-blur-xl">
          <div className="flex justify-between items-center mb-6">
             <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">Recent Activity</h2>
             <span className="text-[10px] font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 px-2 py-1 rounded-xl uppercase">Live</span>
          </div>
          <div className="flex flex-col gap-4">
             {orders.slice(0, 3).map((order) => (
                <div key={`order-${order.id}`} className="flex gap-3">
                   <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-1.5 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                   <div className="flex flex-col">
                      <p className="text-sm font-medium text-zinc-900 dark:text-white">Order <span className="font-bold">{order.orderNumber}</span> updated to <span className="font-bold text-orange-500">{order.status}</span></p>
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">System • {order.customerName}</span>
                   </div>
                </div>
             ))}
             {tasks.slice(0, 2).map((t) => (
                <div key={`task-${t.id}`} className="flex gap-3">
                   <div className="h-2 w-2 rounded-full bg-amber-500 shrink-0 mt-1.5 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                   <div className="flex flex-col">
                      <p className="text-sm font-medium text-zinc-900 dark:text-white">Task <span className="font-bold">{t.title}</span> marked as <span className="font-bold text-amber-500">{t.status}</span></p>
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">System • {users.find(u => u.id === t.assigneeId)?.name || 'Unassigned'}</span>
                   </div>
                </div>
             ))}
             {inventory.slice(0, 1).map((i) => (
                <div key={`inv-${i.id}`} className="flex gap-3">
                   <div className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 mt-1.5 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                   <div className="flex flex-col">
                      <p className="text-sm font-medium text-zinc-900 dark:text-white">Inventory <span className="font-bold">{i.name}</span> levels adjusted</p>
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">System • {i.weightKg}kg</span>
                   </div>
                </div>
             ))}
          </div>
        </motion.div>
      </section>
    </motion.div>
  );
}
