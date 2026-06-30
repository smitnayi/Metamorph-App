import React, { useEffect, useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, Cell, PieChart, Pie } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Package, CheckCircle2, AlertCircle, Activity, TrendingUp, Zap, Clock, Users, ArrowUpRight, ArrowDownRight, MoreHorizontal, FlaskConical } from 'lucide-react';
import { useDataStore } from '../store/data';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { Order } from '../types';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { orders, tasks, qualityChecks, inventory, users, labRoutineChecks } = useDataStore();
  const { currentUser } = useAuth();

  const hasRoutineToday = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return labRoutineChecks.some(c => c.date === today);
  }, [labRoutineChecks]);

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
    const passRate = qualityChecks.length > 0 ? ((passed / qualityChecks.length) * 100).toFixed(1) : '0';
    
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
        const inspectorName = inspectorUser?.name?.split(' ')[0] || 'Unknown';
        if (!employeeQaMap.has(q.inspectorId)) {
           employeeQaMap.set(q.inspectorId, { name: inspectorName, completed: 0, rejected: 0 });
        }
        if (q.overallResult === 'Pass') employeeQaMap.get(q.inspectorId)!.completed++;
        else employeeQaMap.get(q.inspectorId)!.rejected++;
      }
    });

    const qaPerEmployee = Array.from(employeeQaMap.values()).slice(0, 7); // top 7

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
      activeOrders, pendingTasks, passRate, stockAlerts, pipelineData, activityData, overallEfficiency: eff, firstPassYieldData, qaPerEmployee
    };
  }, [orders, tasks, qualityChecks, inventory, users]);

  if (loading) {
    return (
      <div className="h-full w-full p-8 flex flex-col gap-8 bg-[#fafafa] dark:bg-[#0a0a0a]">
        <div className="h-12 w-64 bg-black/5 dark:bg-white/5 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-black/5 dark:bg-white/5 rounded-[32px] animate-pulse" />)}
        </div>
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-full bg-black/5 dark:bg-white/5 rounded-[32px] animate-pulse" />
          <div className="h-full bg-black/5 dark:bg-white/5 rounded-[32px] animate-pulse" />
        </div>
      </div>
    );
  }

  const COLORS = ['#ea580c', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

  return (
    <div className="h-full overflow-y-auto w-full p-4 sm:p-6 lg:p-8 bg-[#fafafa] dark:bg-[#0a0a0a] font-sans relative custom-scrollbar">
      {/* SaaS Background Gradients */}
      <div className="fixed top-0 left-0 w-full h-[600px] overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[150px] -left-[100px] w-[500px] h-[500px] rounded-full bg-orange-500/10 dark:bg-orange-500/5 blur-[120px]" />
        <div className="absolute top-[50px] right-[5%] w-[400px] h-[400px] rounded-full bg-blue-500/10 dark:bg-blue-500/5 blur-[120px]" />
      </div>

      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="relative z-10 max-w-7xl mx-auto space-y-6 lg:space-y-8">
        
        {/* Header Section */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
           <div>
              <label className="text-xs md:text-xs font-semibold text-orange-500">Overview</label>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight mt-1 text-zinc-900 dark:text-white">
                 Welcome back, {currentUser?.name?.split(' ')[0] || 'User'}
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400 mt-2 font-medium text-sm">Here's your operational pulse for today.</p>
           </div>
           <div className="flex items-center gap-4 w-full sm:w-auto">
              <button className="flex-1 sm:flex-none px-5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm font-medium text-zinc-900 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm active:scale-95">
                 Download Report
              </button>
              <button onClick={() => navigate('/orders/new')} className="flex-1 sm:flex-none px-5 py-2.5 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors shadow-sm active:scale-95">
                 New Order
              </button>
           </div>
        </motion.div>

        {/* Missing Lab Alert */}
        {!hasRoutineToday && (
          <motion.div variants={itemVariants} className="bg-rose-500/10 border border-rose-500/20 rounded-[24px] p-5 flex items-start sm:items-center gap-5 cursor-pointer hover:bg-rose-500/15 transition-colors backdrop-blur-md hover:shadow-md" onClick={() => navigate('/lab')}>
             <div className="h-12 w-12 bg-rose-500/20 rounded-xl flex items-center justify-center shrink-0 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                <FlaskConical className="h-6 w-6" />
             </div>
             <div className="flex-1">
                <h3 className="text-sm font-semibold tracking-tight text-rose-700 dark:text-rose-400 mb-1">Missing Lab Report</h3>
                <p className="text-sm font-medium text-rose-700/80 dark:text-rose-300 text-balance leading-relaxed">Today's chemical process control sheet has not been filled out yet.</p>
             </div>
             <div className="hidden sm:block shrink-0">
                <button className="bg-rose-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-rose-700 transition-colors shadow-sm pointer-events-none">
                  Fill Now
                </button>
             </div>
          </motion.div>
        )}

        {/* Key Metrics Grid */}
        <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {/* Metric 1 */}
          <motion.div variants={itemVariants} className="bg-white/40 dark:bg-black/20 backdrop-blur-xl p-6 rounded-[32px] border border-black/5 dark:border-white/5 shadow-sm flex flex-col justify-between group hover:shadow-xl hover:border-orange-500/30 transition-all hover:scale-[1.02] cursor-pointer">
            <div className="flex justify-between items-start mb-6">
              <div className="h-12 w-12 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center group-hover:scale-110 transition-transform border border-orange-500/20">
                <Activity className="h-6 w-6" />
              </div>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-md border border-emerald-500/20">
                <ArrowUpRight className="h-3 w-3 stroke-[3]" /> 12%
              </span>
            </div>
            <div>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold text-zinc-500 mb-2">Overall Efficiency</p>
              <div className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-white group-hover:text-orange-500 transition-colors">{overallEfficiency}%</div>
            </div>
          </motion.div>

          {/* Metric 2 */}
          <motion.div variants={itemVariants} className="bg-white/40 dark:bg-black/20 backdrop-blur-xl p-6 rounded-[32px] border border-black/5 dark:border-white/5 shadow-sm flex flex-col justify-between group hover:shadow-xl hover:border-blue-500/30 transition-all hover:scale-[1.02] cursor-pointer">
            <div className="flex justify-between items-start mb-6">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform border border-blue-500/20">
                <Package className="h-6 w-6" />
              </div>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 text-zinc-500 bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-md border border-black/10 dark:border-white/10">
                Live
              </span>
            </div>
            <div>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold text-zinc-500 mb-2">Active Orders</p>
              <div className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-white group-hover:text-blue-500 transition-colors">{activeOrders}</div>
            </div>
          </motion.div>

          {/* Metric 3 */}
          <motion.div variants={itemVariants} className="bg-white/40 dark:bg-black/20 backdrop-blur-xl p-6 rounded-[32px] border border-black/5 dark:border-white/5 shadow-sm flex flex-col justify-between group hover:shadow-xl hover:border-emerald-500/30 transition-all hover:scale-[1.02] cursor-pointer">
            <div className="flex justify-between items-start mb-6">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform border border-emerald-500/20">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 text-rose-500 bg-rose-500/10 px-3 py-1.5 rounded-md border border-rose-500/20">
                <ArrowDownRight className="h-3 w-3 stroke-[3]" /> 2.4%
              </span>
            </div>
            <div>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold text-zinc-500 mb-2">First-Pass Rate</p>
              <div className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-white group-hover:text-emerald-500 transition-colors">{passRate}%</div>
            </div>
          </motion.div>

          {/* Metric 4 */}
          <motion.div variants={itemVariants} className="bg-white/40 dark:bg-black/20 backdrop-blur-xl p-6 rounded-[32px] border border-black/5 dark:border-white/5 shadow-sm flex flex-col justify-between group hover:shadow-xl hover:border-rose-500/30 transition-all hover:scale-[1.02] cursor-pointer" onClick={() => navigate('/inventory')}>
            <div className="flex justify-between items-start mb-6">
              <div className="h-12 w-12 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform border border-rose-500/20">
                <AlertCircle className="h-6 w-6" />
              </div>
              {stockAlerts > 0 && (
                <span className="flex items-center gap-1 text-xs font-semibold text-zinc-500 text-rose-500 bg-rose-500/10 px-3 py-1.5 rounded-md border border-rose-500/20 animate-pulse">
                  Action Required
                </span>
              )}
            </div>
            <div>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold text-zinc-500 mb-2">Low Stock Alerts</p>
              <div className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-white group-hover:text-rose-500 transition-colors">{stockAlerts}</div>
            </div>
          </motion.div>
        </motion.div>

        {/* Main Charts & Side Feed Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Main Content Area */}
          <div className="xl:col-span-2 space-y-6">
            
            {/* Big Chart: Activity Overview */}
            <motion.div variants={itemVariants} className="bg-white/40 dark:bg-black/20 backdrop-blur-xl p-6 sm:p-8 rounded-[32px] border border-black/5 dark:border-white/5 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-xs font-semibold text-zinc-900 dark:text-white">Volume Overview</h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold mt-1">Orders & tasks due this week</p>
                </div>
                <div className="hidden sm:flex items-center gap-2 bg-black/5 dark:bg-white/5 p-1.5 rounded-lg border border-black/5 dark:border-white/5">
                  <button className="px-4 py-2 text-xs font-semibold text-zinc-500 rounded-md bg-white dark:bg-[#222] text-zinc-900 dark:text-white shadow-sm">7 Days</button>
                  <button className="px-4 py-2 text-xs font-semibold text-zinc-500 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors">30 Days</button>
                </div>
              </div>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                  <AreaChart data={activityData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ea580c" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#ea580c" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150,150,150,0.1)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#a1a1aa', fontSize: 11, fontWeight: 700}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#a1a1aa', fontSize: 11, fontWeight: 700}} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(25,25,25,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: '#fff', backdropFilter: 'blur(8px)', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}
                      itemStyle={{ fontSize: '13px', fontWeight: 'bold' }}
                      cursor={{ stroke: 'rgba(150,150,150,0.2)', strokeWidth: 1, strokeDasharray: '5 5' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#71717a' }}/>
                    <Area type="monotone" name="Due Orders" dataKey="orders" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorOrders)" activeDot={{ r: 8, strokeWidth: 0, fill: '#3b82f6' }} />
                    <Area type="monotone" name="Due Tasks" dataKey="tasks" stroke="#ea580c" strokeWidth={4} fillOpacity={1} fill="url(#colorTasks)" activeDot={{ r: 8, strokeWidth: 0, fill: '#ea580c' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Row with two smaller charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               
               <motion.div variants={itemVariants} className="bg-white/40 dark:bg-black/20 backdrop-blur-xl p-6 sm:p-8 rounded-[32px] border border-black/5 dark:border-white/5 shadow-sm">
                 <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xs font-semibold text-zinc-900 dark:text-white">Pipeline Breakdown</h2>
                    <button className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors bg-white/60 dark:bg-black/40 p-2 rounded-lg"><MoreHorizontal className="h-5 w-5" /></button>
                 </div>
                 <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                      <BarChart data={pipelineData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }} barSize={16}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150,150,150,0.1)" />
                        <XAxis dataKey="stage" axisLine={false} tickLine={false} tick={{fill: '#a1a1aa', fontSize: 10, fontWeight: 700}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#a1a1aa', fontSize: 10, fontWeight: 700}} />
                        <Tooltip 
                          cursor={{fill: 'rgba(150,150,150,0.05)'}}
                          contentStyle={{ backgroundColor: 'rgba(25,25,25,0.9)', border: 'none', borderRadius: '16px', color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                        />
                        <Bar dataKey="count" name="Orders" radius={[8, 8, 8, 8]}>
                          {pipelineData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                 </div>
               </motion.div>

               <motion.div variants={itemVariants} className="bg-white/40 dark:bg-black/20 backdrop-blur-xl p-6 sm:p-8 rounded-[32px] border border-black/5 dark:border-white/5 shadow-sm">
                 <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xs font-semibold text-zinc-900 dark:text-white">Inspector QA Performance</h2>
                    <button className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors bg-white/60 dark:bg-black/40 p-2 rounded-lg"><MoreHorizontal className="h-5 w-5" /></button>
                 </div>
                 <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                      <BarChart data={qaPerEmployee} margin={{ top: 0, right: 0, left: -25, bottom: 0 }} barSize={12} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(150,150,150,0.1)" />
                        <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#a1a1aa', fontSize: 10, fontWeight: 700}} />
                        <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#a1a1aa', fontSize: 11, fontWeight: 700}} width={60} />
                        <Tooltip 
                          cursor={{fill: 'rgba(150,150,150,0.05)'}}
                          contentStyle={{ backgroundColor: 'rgba(25,25,25,0.9)', border: 'none', borderRadius: '16px', color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                        />
                        <Bar dataKey="completed" name="Pass" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="rejected" name="Fail" stackId="a" fill="#f43f5e" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                 </div>
               </motion.div>

            </div>
          </div>

          {/* Right Sidebar: Quick Actions & Feed */}
          <div className="space-y-6">
            
            {/* Quick Actions (Mini widgets) */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
               <div className="bg-orange-500 p-6 rounded-[32px] shadow-[0_10px_30px_-10px_rgba(234,88,12,0.5)] text-white cursor-pointer hover:scale-[1.02] transition-transform active:scale-95" onClick={() => navigate('/orders')}>
                  <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center mb-4 border border-black/10">
                     <TrendingUp className="h-5 w-5 stroke-[2.5]" />
                  </div>
                  <h3 className="font-semibold uppercase tracking-tight text-sm">Manage Orders</h3>
                  <p className="text-black/60 text-xs font-semibold text-zinc-500 mt-2">View active pipeline</p>
               </div>
               <div className="bg-blue-500 p-6 rounded-[32px] shadow-[0_10px_30px_-10px_rgba(59,130,246,0.5)] text-white cursor-pointer hover:scale-[1.02] transition-transform active:scale-95" onClick={() => navigate('/quality')}>
                  <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center mb-4 border border-white/20">
                     <CheckCircle2 className="h-5 w-5 stroke-[2.5]" />
                  </div>
                  <h3 className="font-semibold uppercase tracking-tight text-sm">Quality Check</h3>
                  <p className="text-white/80 text-xs font-semibold text-zinc-500 mt-2">Review inspection</p>
               </div>
            </motion.div>

            {/* Activity Feed */}
            <motion.div variants={itemVariants} className="bg-white/40 dark:bg-black/20 backdrop-blur-xl p-6 sm:p-8 rounded-[32px] border border-black/5 dark:border-white/5 shadow-sm flex flex-col h-[520px]">
               <div className="flex justify-between items-center mb-8">
                  <h2 className="text-xs font-semibold text-zinc-900 dark:text-white">Recent Activity</h2>
                  <span className="text-xs font-semibold bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 px-3 py-1.5 rounded-md uppercase tracking-[0.1em] animate-pulse">LIVE</span>
               </div>
               
               <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar">
                 {orders.slice(0, 4).map((order, i) => (
                    <div key={`order-${order.id}-${i}`} className="flex gap-5 group">
                       <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 border border-blue-500/20 group-hover:scale-110 transition-transform">
                          <Package className="h-5 w-5" />
                       </div>
                       <div className="flex flex-col justify-center">
                          <p className="text-sm font-semibold text-zinc-900 dark:text-white line-clamp-1">
                             Order <span className="font-semibold">{order.orderNumber}</span> updated to <span className="text-blue-500 font-semibold">{order.status}</span>
                          </p>
                          <span className="text-xs font-semibold text-zinc-500 text-zinc-500 mt-1">{order.customerName}</span>
                       </div>
                    </div>
                 ))}
                 
                 {tasks.slice(0, 3).map((t, i) => (
                    <div key={`task-${t.id}-${i}`} className="flex gap-5 group">
                       <div className="h-12 w-12 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0 border border-orange-500/20 group-hover:scale-110 transition-transform">
                          <Clock className="h-5 w-5" />
                       </div>
                       <div className="flex flex-col justify-center">
                          <p className="text-sm font-semibold text-zinc-900 dark:text-white line-clamp-1">
                             Task <span className="font-semibold">{t.title}</span> marked as <span className="text-orange-500 font-semibold">{t.status}</span>
                          </p>
                          <span className="text-xs font-semibold text-zinc-500 text-zinc-500 mt-1">{users.find(u => u.id === t.assigneeId)?.name || 'Unassigned'}</span>
                       </div>
                    </div>
                 ))}

                 {inventory.slice(0, 2).map((inv, i) => (
                    <div key={`inv-${inv.id}-${i}`} className="flex gap-5 group">
                       <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                          <Zap className="h-5 w-5" />
                       </div>
                       <div className="flex flex-col justify-center">
                          <p className="text-sm font-semibold text-zinc-900 dark:text-white line-clamp-1">
                             Inventory <span className="font-semibold">{inv.name}</span> adjusted
                          </p>
                          <span className="text-xs font-semibold text-zinc-500 text-zinc-500 mt-1">{inv.weightKg}kg remaining</span>
                       </div>
                    </div>
                 ))}
               </div>
               
               <button className="w-full mt-6 py-4 bg-white/60 dark:bg-black/40 backdrop-blur-md border border-black/10 dark:border-white/10 hover:bg-white dark:hover:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl text-xs font-semibold transition-colors shadow-sm active:scale-95">
                  View All Activity
               </button>
            </motion.div>

          </div>
        </div>
      </motion.div>
    </div>
  );
}
