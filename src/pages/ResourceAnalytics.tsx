import React, { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  LineChart,
  Line,
  Brush,
} from "recharts";
import {
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  DownloadCloud,
  Zap,
  Droplet,
  Flame,
} from "lucide-react";
import { cn } from "../lib/utils";
import { toast } from "sonner";
import { useDataStore } from "../store/data";
import Modal from "../components/ui/Modal";
import { motion } from "motion/react";

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

export default function ResourceAnalytics() {
  const [timeframe, setTimeframe] = useState<"Daily" | "Weekly" | "Monthly">(
    "Weekly",
  );
  const { orders, tasks, qualityChecks, utilityMetrics, setUtilityMetrics } =
    useDataStore();

  const [isUtilityModalOpen, setIsUtilityModalOpen] = useState(false);
  const [newUtility, setNewUtility] = useState({
    date: new Date().toISOString().slice(0, 10),
    electricityKwh: 0,
    gasKg: 0,
    waterLiters: 0,
  });

  const handleSaveUtility = (e: React.FormEvent) => {
    e.preventDefault();
    const existingIndex = utilityMetrics.findIndex(
      (m) => m.date === newUtility.date,
    );
    if (existingIndex >= 0) {
      setUtilityMetrics((prev) => {
        const next = [...prev];
        next[existingIndex] = { ...next[existingIndex], ...newUtility };
        return next;
      });
    } else {
      setUtilityMetrics((prev) => [
        ...prev,
        { id: Math.random().toString(), ...newUtility },
      ]);
    }
    setIsUtilityModalOpen(false);
    toast.success("Utility metrics saved!");
  };

  const { weeklyData, orderStats, qaStats, taskStats } = useMemo(() => {
    // Generate last 7 days data
    const map = new Map();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = daysOfWeek[d.getDay()];
      map.set(dayName, {
        name: dayName,
        newOrders: 0,
        completedOrders: 0,
        tasksDone: 0,
      });
    }

    let totalVal = 0;

    orders.forEach((o) => {
      totalVal += o.totalValue || 0;
      if (o.dueDate) {
        const d = new Date(o.dueDate);
        const dayName = daysOfWeek[d.getDay()];
        if (map.has(dayName)) {
          if (o.status === "Completed" || o.status === "Shipped")
            map.get(dayName).completedOrders++;
          else map.get(dayName).newOrders++;
        }
      }
    });

    tasks.forEach((t) => {
      if (t.status === "Done") {
        const d = new Date(t.dueDate || new Date());
        const dayName = daysOfWeek[d.getDay()];
        if (map.has(dayName)) {
          map.get(dayName).tasksDone++;
        }
      }
    });

    const weeklyData = Array.from(map.values());

    const completed = orders.filter(
      (o) => o.status === "Completed" || o.status === "Shipped",
    ).length;
    const orderStats = {
      total: orders.length,
      revenue: totalVal,
      completionRate:
        orders.length > 0 ? ((completed / orders.length) * 100).toFixed(0) : 0,
    };

    const passedChecks = qualityChecks.filter(
      (q) => q.overallResult === "Pass",
    ).length;
    const qaStats = {
      total: qualityChecks.length,
      passRate:
        qualityChecks.length > 0
          ? ((passedChecks / qualityChecks.length) * 100).toFixed(0)
          : 0,
    };

    const doneTasks = tasks.filter((t) => t.status === "Done").length;
    const taskStats = {
      total: tasks.length,
      completionRate:
        tasks.length > 0 ? ((doneTasks / tasks.length) * 100).toFixed(0) : 0,
    };

    return { weeklyData, orderStats, qaStats, taskStats };
  }, [orders, tasks, qualityChecks]);

  const handleExport = () => {
    let csvContent = "Metric,Value\n";
    csvContent += `Total Orders,${orderStats.total}\n`;
    csvContent += `Total Revenue,${orderStats.revenue}\n`;
    csvContent += `Tasks Total,${taskStats.total}\n`;
    csvContent += `Tasks Completion %,${taskStats.completionRate}\n`;
    csvContent += `QA Pass Rate,${qaStats.passRate}%\n\n`;

    csvContent += "Daily Breakdown\n";
    csvContent += "Day,Orders,Completed,Tasks Done\n";
    weeklyData.forEach((day) => {
      csvContent += `${day.name},${day.newOrders},${day.completedOrders},${day.tasksDone}\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `analytics-report-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Report successfully exported as CSV.");
  };

  return (
    <div className="h-full overflow-y-auto w-full p-4 sm:p-6 lg:p-8 bg-[#fafafa] dark:bg-[#0a0a0a] font-sans relative custom-scrollbar">
      {/* SaaS Background Gradients */}
      <div className="fixed top-0 left-0 w-full h-[600px] overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[150px] -left-[100px] w-[500px] h-[500px] rounded-full bg-orange-500/10 dark:bg-orange-500/5 blur-[120px]" />
        <div className="absolute top-[50px] right-[5%] w-[400px] h-[400px] rounded-full bg-rose-500/10 dark:bg-rose-500/5 blur-[120px]" />
      </div>

      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="relative z-10 max-w-7xl mx-auto space-y-6 lg:space-y-8">
        
        {/* Header Section */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
           <div>
              <label className="text-xs md:text-xs font-semibold text-orange-500">Analytics</label>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight mt-1 text-zinc-900 dark:text-white">
                 Resource Analytics
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400 mt-2 font-medium text-sm">Real-time performance metrics and historical trends.</p>
           </div>
           <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="flex bg-white/60 dark:bg-[#111]/80 backdrop-blur-md border border-black/5 dark:border-white/10 p-1.5 rounded-lg shadow-sm">
                {["Daily", "Weekly", "Monthly"].map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf as any)}
                    className={cn(
                      "px-4 py-2 text-xs font-semibold text-zinc-500 transition-all rounded-md",
                      timeframe === tf
                        ? "bg-zinc-100 dark:bg-[#222] text-zinc-900 dark:text-white shadow-sm"
                        : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5",
                    )}
                  >
                    {tf}
                  </button>
                ))}
              </div>
              <button
                onClick={handleExport}
                className="flex items-center px-6 py-3.5 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors shadow-sm active:scale-95"
              >
                <DownloadCloud className="h-4 w-4 sm:mr-2 stroke-[2.5]" />
                <span className="hidden sm:inline">Export Report</span>
              </button>
           </div>
        </motion.div>

        {/* KPI Cards */}
        <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          <motion.div variants={itemVariants} className="bg-white/40 dark:bg-black/20 backdrop-blur-xl p-6 rounded-[32px] border border-black/5 dark:border-white/5 shadow-sm group hover:shadow-xl hover:border-orange-500/30 transition-all hover:scale-[1.02]">
            <div className="flex justify-between items-start mb-6">
              <div className="h-12 w-12 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center group-hover:scale-110 transition-transform border border-orange-500/20">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div
                className={cn(
                  "flex items-center text-xs font-semibold text-zinc-500 px-3 py-1.5 rounded-md border",
                  orderStats.completionRate > 50
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-500 border-rose-500/20",
                )}
              >
                {orderStats.completionRate > 50 ? (
                  <ArrowUpRight className="h-3 w-3 mr-1 stroke-[3]" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 mr-1 stroke-[3]" />
                )}
                {orderStats.completionRate}% Done
              </div>
            </div>
            <div className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold text-zinc-500 mb-2">
              Total Order Revenue
            </div>
            <div className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-white group-hover:text-orange-500 transition-colors">
              ₹{orderStats.revenue.toLocaleString()}
            </div>
            <p className="text-xs font-semibold text-zinc-500 text-zinc-500 mt-3">
              {orderStats.total} Total Orders
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white/40 dark:bg-black/20 backdrop-blur-xl p-6 rounded-[32px] border border-black/5 dark:border-white/5 shadow-sm group hover:shadow-xl hover:border-rose-500/30 transition-all hover:scale-[1.02]">
            <div className="flex justify-between items-start mb-6">
              <div className="h-12 w-12 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform border border-rose-500/20">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="flex items-center bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 px-3 py-1.5 rounded-md text-zinc-500 text-xs font-semibold text-zinc-500">
                {qaStats.total} Checks
              </div>
            </div>
            <div className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold text-zinc-500 mb-2">
              QA Pass Rate
            </div>
            <div className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-white group-hover:text-rose-500 transition-colors">
              {qaStats.passRate}<span className="text-xl text-zinc-500 ml-1">%</span>
            </div>
            <p className="text-xs font-semibold text-zinc-500 text-zinc-500 mt-3">
              Overall Quality Score
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white/40 dark:bg-black/20 backdrop-blur-xl p-6 rounded-[32px] border border-black/5 dark:border-white/5 shadow-sm group hover:shadow-xl hover:border-emerald-500/30 transition-all hover:scale-[1.02]">
            <div className="flex justify-between items-start mb-6">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform border border-emerald-500/20">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div
                className={cn(
                  "flex items-center text-xs font-semibold text-zinc-500 px-3 py-1.5 rounded-md border",
                  taskStats.completionRate > 50
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-500 border-rose-500/20",
                )}
              >
                {taskStats.completionRate > 50 ? (
                  <ArrowUpRight className="h-3 w-3 mr-1 stroke-[3]" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 mr-1 stroke-[3]" />
                )}
                {taskStats.completionRate}%
              </div>
            </div>
            <div className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold text-zinc-500 mb-2">
              Task Completion Score
            </div>
            <div className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-white group-hover:text-emerald-500 transition-colors">
              {taskStats.completionRate}<span className="text-xl text-zinc-500 ml-1">/100</span>
            </div>
            <p className="text-xs font-semibold text-zinc-500 text-zinc-500 mt-3">
              {taskStats.total} Total Workflow Tasks
            </p>
          </motion.div>
        </motion.div>

        {/* Charts */}
        <motion.div variants={itemVariants} className="bg-white/40 dark:bg-black/20 backdrop-blur-xl p-6 sm:p-8 rounded-[32px] border border-black/5 dark:border-white/5 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-xs font-semibold text-zinc-900 dark:text-white">Historical Trends</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold mt-1">Orders vs Completed vs Tasks</p>
            </div>
          </div>
          <div className="h-[340px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <AreaChart data={weeklyData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDueOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
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
                <Brush dataKey="name" height={30} stroke="#f97316" fill="rgba(150,150,150,0.05)" tickFormatter={() => ""} />
                <Area type="monotone" name="New Orders" dataKey="newOrders" stroke="#f97316" strokeWidth={4} fillOpacity={1} fill="url(#colorDueOrders)" activeDot={{ r: 8, strokeWidth: 0, fill: '#f97316' }} />
                <Area type="monotone" name="Completed Orders" dataKey="completedOrders" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorCompleted)" activeDot={{ r: 8, strokeWidth: 0, fill: '#10b981' }} />
                <Area type="monotone" name="Done Tasks" dataKey="tasksDone" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorTasks)" activeDot={{ r: 8, strokeWidth: 0, fill: '#3b82f6' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div variants={itemVariants} className="bg-white/40 dark:bg-black/20 backdrop-blur-xl p-6 sm:p-8 rounded-[32px] border border-black/5 dark:border-white/5 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-xs font-semibold text-zinc-900 dark:text-white flex items-center gap-3">
                  <div className="w-8 h-8 rounded-[10px] bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                    <Zap className="w-4 h-4 text-orange-500" />
                  </div>
                  Utility Logging
                </h2>
              </div>
              <button
                onClick={() => setIsUtilityModalOpen(true)}
                className="bg-white/60 dark:bg-black/40 backdrop-blur-md border border-black/10 dark:border-white/10 hover:bg-white dark:hover:bg-zinc-800 text-zinc-900 dark:text-white px-4 py-2 text-xs font-semibold text-zinc-500 rounded-lg transition-colors shadow-sm active:scale-95"
              >
                Log Metrics
              </button>
            </div>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {utilityMetrics.length === 0 ? (
                <div className="text-center text-xs font-semibold text-zinc-500 text-zinc-500 py-10">
                  No metrics logged yet.
                </div>
              ) : (
                utilityMetrics
                  .slice()
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((m) => (
                    <div
                      key={m.id}
                      className="bg-white/60 dark:bg-black/40 backdrop-blur-md border border-black/5 dark:border-white/5 p-5 rounded-[24px] flex flex-wrap items-center justify-between gap-4 hover:shadow-md hover:border-orange-500/30 transition-all group"
                    >
                      <div className="font-semibold text-zinc-900 dark:text-white text-sm group-hover:text-orange-500 transition-colors">
                        {m.date}
                      </div>
                      <div className="flex gap-4">
                        <div className="flex items-center gap-1.5 font-semibold text-orange-600 dark:text-orange-400 text-sm">
                          <Zap className="w-4 h-4" /> {m.electricityKwh}{" "}
                          <span className="text-xs font-semibold text-zinc-500">kWh</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-semibold text-rose-600 dark:text-rose-400 text-sm">
                          <Flame className="w-4 h-4" /> {m.gasKg}{" "}
                          <span className="text-xs font-semibold text-zinc-500">KG</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-semibold text-blue-600 dark:text-blue-400 text-sm">
                          <Droplet className="w-4 h-4" /> {m.waterLiters}{" "}
                          <span className="text-xs font-semibold text-zinc-500">L</span>
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white/40 dark:bg-black/20 backdrop-blur-xl p-6 sm:p-8 rounded-[32px] border border-black/5 dark:border-white/5 shadow-sm">
            <h2 className="text-xs font-semibold text-zinc-900 dark:text-white mb-8">
              Consumption Trends
            </h2>
            <div className="h-[300px] w-full">
              {utilityMetrics.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center text-xs font-semibold text-zinc-500 text-zinc-500 border border-dashed border-black/10 dark:border-white/10 rounded-[24px]">
                  No trend data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                  <LineChart
                    data={utilityMetrics
                      .slice()
                      .sort((a, b) => a.date.localeCompare(b.date))}
                    margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150,150,150,0.1)" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#a1a1aa', fontSize: 11, fontWeight: 700}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#a1a1aa', fontSize: 11, fontWeight: 700}} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(25,25,25,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: '#fff', backdropFilter: 'blur(8px)', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}
                      itemStyle={{ fontSize: '13px', fontWeight: 'bold' }}
                      cursor={{ stroke: 'rgba(150,150,150,0.2)', strokeWidth: 1, strokeDasharray: '5 5' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#71717a' }}/>
                    <Line type="monotone" name="Electricity (kWh)" dataKey="electricityKwh" stroke="#f97316" strokeWidth={4} activeDot={{ r: 8, strokeWidth: 0, fill: '#f97316' }} dot={false} />
                    <Line type="monotone" name="Gas (KG)" dataKey="gasKg" stroke="#ef4444" strokeWidth={4} activeDot={{ r: 8, strokeWidth: 0, fill: '#ef4444' }} dot={false} />
                    <Line type="monotone" name="Water (Liters)" dataKey="waterLiters" stroke="#3b82f6" strokeWidth={4} activeDot={{ r: 8, strokeWidth: 0, fill: '#3b82f6' }} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>
        </div>

      </motion.div>

      <Modal
        isOpen={isUtilityModalOpen}
        onClose={() => setIsUtilityModalOpen(false)}
        title="Log Monthly Utilities"
      >
        <form
          onSubmit={handleSaveUtility}
          className="p-6 md:p-8 space-y-6"
        >
            <div>
              <label className="text-xs font-semibold text-zinc-500 text-zinc-700 dark:text-zinc-300 mb-2 block">Date</label>
              <input
                type="date"
                required
                value={newUtility.date}
                onChange={(e) =>
                  setNewUtility({ ...newUtility, date: e.target.value })
                }
                className="w-full bg-white dark:bg-[#111] border border-black/10 dark:border-white/10 rounded-xl px-4 py-4 text-sm font-semibold text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 shadow-sm transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-500 text-zinc-700 dark:text-zinc-300 mb-2 block">Electricity Units (kWh)</label>
              <input
                type="number"
                step="0.1"
                required
                value={newUtility.electricityKwh}
                onChange={(e) =>
                  setNewUtility({
                    ...newUtility,
                    electricityKwh: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full bg-white dark:bg-[#111] border border-black/10 dark:border-white/10 rounded-xl px-4 py-4 text-sm font-semibold text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 shadow-sm transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-500 text-zinc-700 dark:text-zinc-300 mb-2 block">Gas Usage (KG)</label>
              <input
                type="number"
                step="0.1"
                required
                value={newUtility.gasKg}
                onChange={(e) =>
                  setNewUtility({
                    ...newUtility,
                    gasKg: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full bg-white dark:bg-[#111] border border-black/10 dark:border-white/10 rounded-xl px-4 py-4 text-sm font-semibold text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 shadow-sm transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-500 text-zinc-700 dark:text-zinc-300 mb-2 block">Water Usage (Liters RO/DM)</label>
              <input
                type="number"
                step="0.1"
                required
                value={newUtility.waterLiters}
                onChange={(e) =>
                  setNewUtility({
                    ...newUtility,
                    waterLiters: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full bg-white dark:bg-[#111] border border-black/10 dark:border-white/10 rounded-xl px-4 py-4 text-sm font-semibold text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 shadow-sm transition-colors"
              />
            </div>
            <div className="flex gap-4 pt-4 mt-8">
              <button
                type="button"
                onClick={() => setIsUtilityModalOpen(false)}
                className="flex-1 py-4 text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-white dark:bg-[#222] border border-black/10 dark:border-white/10 rounded-xl hover:bg-zinc-50 dark:hover:bg-[#333] transition-colors active:scale-95 shadow-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-4 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 shadow-[0_0_20px_rgba(234,88,12,0.3)] rounded-xl transition-all active:scale-95"
              >
                Save Log
              </button>
            </div>
        </form>
      </Modal>
    </div>
  );
}

