import React, { useState, useMemo } from 'react';
import { useDataStore } from '../store/data';
import { useAuth } from '../contexts/AuthContext';
import { useRoleAccess } from '../hooks/useRoleAccess';
import { usePin } from '../contexts/PinContext';
import { Users, UserPlus, Clock, IndianRupee, FileText, Download, CheckCircle, Trash2, X, Settings } from 'lucide-react';
import { toast } from 'sonner';
import Modal from '../components/ui/Modal';
import TimeWheelPicker from '../components/TimeWheelPicker';
import { Labor, LaborAttendance } from '../types';
import { cn } from '../lib/utils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { motion } from 'motion/react';

const formatHM = (decimalHours: number) => {
  const h = Math.floor(decimalHours);
  const m = Math.round((decimalHours - h) * 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  if (decimalHours === 0) return `0h`;
  return `${m}m`;
};

function TimePicker12({ value, onChange, disabled }: { value?: string, onChange: (iso?: string) => void, disabled?: boolean }) {
  const d = value ? parseISO(value) : null;
  const hours24 = d ? d.getHours() : 0;
  const minutes = d ? d.getMinutes() : 0;
  
  const isPM = hours24 >= 12;
  const hours12 = d ? (hours24 % 12 || 12) : '';
  const minsStr = d ? minutes.toString().padStart(2, '0') : '';

  const updateTime = (h12: string | number, m: string | number, pm: boolean) => {
    if (h12 === '' || m === '') return;
    let h24 = Number(h12);
    if (pm && h24 < 12) h24 += 12;
    if (!pm && h24 === 12) h24 = 0;
    
    const newD = new Date();
    newD.setHours(h24, Number(m), 0, 0);
    onChange(newD.toISOString());
  };

  return (
    <div className={cn("flex items-center bg-white/80 dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 rounded-xl px-2 py-1.5 shadow-sm transition-all focus-within:border-orange-500", disabled && "opacity-50 pointer-events-none")}>
      <input 
        type="number" 
        min="1" max="12" 
        value={hours12} 
        onChange={e => updateTime(e.target.value, minsStr || 0, isPM)}
        className="w-8 bg-transparent text-center font-bold text-zinc-900 dark:text-white focus:outline-none placeholder:text-zinc-400 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        placeholder="12"
        disabled={disabled}
      />
      <span className="text-zinc-400 font-bold">:</span>
      <input 
        type="number" 
        min="0" max="59" 
        value={minsStr} 
        onChange={e => updateTime(hours12 || 12, e.target.value, isPM)}
        className="w-8 bg-transparent text-center font-bold text-zinc-900 dark:text-white focus:outline-none placeholder:text-zinc-400 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        placeholder="00"
        disabled={disabled}
      />
      <button 
        type="button"
        onClick={() => updateTime(hours12 || 12, minsStr || 0, !isPM)}
        disabled={disabled}
        className={cn(
          "ml-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors active:scale-95",
          value ? (isPM ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" : "bg-orange-500/10 text-orange-600 dark:text-orange-400") : "bg-black/5 dark:bg-white/5 text-zinc-500"
        )}
      >
        {value ? (isPM ? 'PM' : 'AM') : 'AM'}
      </button>
      {value && (
         <button type="button" onClick={() => onChange(undefined)} disabled={disabled} className="ml-1 p-1.5 text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"><X className="w-3.5 h-3.5" /></button>
      )}
    </div>
  )
}

export default function Labors() {
  const { labors, setLabors, laborAttendances, setLaborAttendances, roles, laborRoles, setLaborRoles, addActivityLog, activityLogs } = useDataStore();
  const { currentUser } = useAuth();
  const { hasPermission } = useRoleAccess();
  const isAdmin = hasPermission(currentUser as any, 'manage', 'all');

  const [isAddLaborModalOpen, setIsAddLaborModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [attendanceSearchQuery, setAttendanceSearchQuery] = useState('');
  const [isAuditLogOpen, setIsAuditLogOpen] = useState(false);
  
  const [newShift, setNewShift] = useState({ name: '', shiftHours: 8 });

  const handleAddShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShift.name || newShift.shiftHours <= 0) return;
    const shift = {
      id: `role-${Date.now()}`,
      name: newShift.name,
      shiftHours: newShift.shiftHours
    };
    setLaborRoles([...laborRoles, shift]);
    setNewShift({ name: '', shiftHours: 8 });
    toast.success('Shift role added');
  };

  const handleDeleteShift = (id: string) => {
    if (labors.some(l => l.roleId === id)) {
      toast.error('Cannot delete shift role that is assigned to labors');
      return;
    }
    setLaborRoles(laborRoles.filter(r => r.id !== id));
    toast.success('Shift role deleted');
  };

  const [newLabor, setNewLabor] = useState<Partial<Labor>>({
    name: '', dailySalary: 700, phone: '', status: 'Active', roleId: laborRoles[0]?.id || ''
  });
  const [editingLabor, setEditingLabor] = useState<Labor | null>(null);
  const [isEditLaborModalOpen, setIsEditLaborModalOpen] = useState(false);

  const [isPinVerified, setIsPinVerified] = useState(false);

  const { requirePin } = usePin();

  const handleUnlockEditing = () => {
    requirePin(() => {
      setIsPinVerified(true);
      toast.success("Time editing unlocked for this session.");
    }, "Enter Admin PIN to unlock time editing (hint: 0000)");
  };

  const [attendanceDate, setAttendanceDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

  const [timeSelector, setTimeSelector] = useState<{
    isOpen: boolean;
    laborId: string;
    type: 'in' | 'out';
    timeValue: string;
  }>({
    isOpen: false,
    laborId: '',
    type: 'in',
    timeValue: format(new Date(), 'HH:mm')
  });

  const openTimeSelector = (laborId: string, type: 'in' | 'out') => {
    setTimeSelector({
      isOpen: true,
      laborId,
      type,
      timeValue: format(new Date(), 'HH:mm')
    });
  };

  const confirmTimeSelection = (e: React.FormEvent) => {
    e.preventDefault();
    const today = format(new Date(), 'yyyy-MM-dd');
    const [hours, minutes] = timeSelector.timeValue.split(':');
    const selectedDate = new Date();
    selectedDate.setHours(Number(hours), Number(minutes), 0, 0);
    const timeIso = selectedDate.toISOString();
    
    const existing = laborAttendances.find(a => a.laborId === timeSelector.laborId && a.date === today);
    
    if (timeSelector.type === 'in') {
      if (existing) {
        setLaborAttendances(prev => prev.map(a => 
          a.id === existing.id ? { ...a, clockIn: timeIso, status: 'Present' } : a
        ));
      } else {
        setLaborAttendances(prev => [
          ...prev,
          {
            id: Math.random().toString(),
            laborId: timeSelector.laborId,
            date: today,
            status: 'Present',
            overtimeHours: 0,
            clockIn: timeIso
          }
        ]);
      }
      toast.success('Clock in time recorded');
    } else {
      if (existing) {
        setLaborAttendances(prev => prev.map(a => 
          a.id === existing.id ? { ...a, clockOut: timeIso } : a
        ));
        toast.success('Clock out time recorded');
      } else {
        toast.error('No clock-in record found for today');
      }
    }
    setTimeSelector(prev => ({ ...prev, isOpen: false }));
  };

  // Handler for adding labor
  const handleAddLabor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabor.name || !newLabor.dailySalary) return;
    
    const finalRoleId = newLabor.roleId && laborRoles.find(r => r.id === newLabor.roleId) 
      ? newLabor.roleId 
      : laborRoles[0]?.id;

    const labor: Labor = {
      id: Math.random().toString(),
      name: newLabor.name,
      dailySalary: Number(newLabor.dailySalary),
      phone: newLabor.phone || '',
      status: 'Active',
      joinDate: new Date().toISOString(),
      roleId: finalRoleId
    };
    
    setLabors(prev => [...prev, labor]);
    toast.success(`Labor ${labor.name} added successfully.`);
    setIsAddLaborModalOpen(false);
    setNewLabor({ name: '', dailySalary: 700, phone: '', status: 'Active', roleId: laborRoles[0]?.id || '' });
  };

  const handleEditLaborSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLabor || !editingLabor.name || !editingLabor.dailySalary) return;
    
    const finalRoleId = editingLabor.roleId && laborRoles.find(r => r.id === editingLabor.roleId)
      ? editingLabor.roleId
      : laborRoles[0]?.id;

    setLabors(labors.map(l => l.id === editingLabor.id ? { ...editingLabor, roleId: finalRoleId } : l));
    setIsEditLaborModalOpen(false);
    setEditingLabor(null);
    toast.success('Labor details updated');
  };

  const toggleLaborStatus = (id: string, currentStatus: string) => {
    setLabors(prev => prev.map(l => l.id === id ? { ...l, status: currentStatus === 'Active' ? 'Inactive' : 'Active' } : l));
    toast.success('Labor status updated');
  };

  // Monthly summary calculations
  const monthStart = startOfMonth(parseISO(selectedMonth + '-01'));
  const monthEnd = endOfMonth(monthStart);
  
  const monthlySummary = useMemo(() => {
    return labors.map(labor => {
      const attendances = laborAttendances.filter(a => 
        a.laborId === labor.id && 
        a.date.startsWith(selectedMonth)
      );

      const role = laborRoles.find(r => r.id === labor.roleId) || laborRoles[0];
      const shiftHours = role ? role.shiftHours : 12; // Fallback to 12 if unknown
      const hourlyRate = labor.dailySalary / shiftHours;
      
      let presentDays = 0;
      let totalWorkedHours = 0;
      let totalOvertimeHours = 0;
      let totalSalary = 0;

      attendances.forEach(a => {
        let dailyHours = 0;
        let isPresent = false;
        
        if (a.manualHours !== undefined || a.manualMinutes !== undefined) {
           dailyHours = (a.manualHours || 0) + ((a.manualMinutes || 0) / 60);
           if (dailyHours > 0) isPresent = true;
        } else if (a.clockIn && a.clockOut) {
           const inTime = new Date(a.clockIn).getTime();
           const outTime = new Date(a.clockOut).getTime();
           if (!isNaN(inTime) && !isNaN(outTime)) {
              dailyHours = (outTime - inTime) / (1000 * 60 * 60);
              if (dailyHours < 0) dailyHours += 24; // Handle overnight shifts
           }
           if (dailyHours > 0) isPresent = true;
        } else if (a.clockIn && !a.clockOut) {
           // Clocked in but not out yet, count as 0 hours for total calculation until clocked out.
           isPresent = true;
        } else if (a.status === 'Present') {
           dailyHours = shiftHours;
           if (a.overtimeHours) dailyHours += a.overtimeHours;
           isPresent = true;
        } else if (a.status === 'Half-Day') {
           dailyHours = shiftHours / 2;
        }

        if (isPresent) presentDays++;
        
        totalWorkedHours += dailyHours;
        
        if (dailyHours > shiftHours) {
          totalOvertimeHours += (dailyHours - shiftHours);
        }
        
        totalSalary += dailyHours * hourlyRate;
      });

      return {
        labor,
        presentDays,
        totalWorkedHours,
        totalOvertimeHours,
        totalSalary
      };
    });
  }, [labors, laborAttendances, selectedMonth]);

  const handleMarkAttendance = (laborId: string, updates: Partial<LaborAttendance>) => {
    // Log audit activity if manual hours or clock times are explicitly changed by an admin
    if ('manualHours' in updates || 'manualMinutes' in updates || 'clockIn' in updates || 'clockOut' in updates) {
       addActivityLog({
          userId: currentUser?.id || 'sys',
          userName: currentUser?.name || 'System',
          action: 'Manual Attendance Override',
          module: 'Labor',
          details: `Admin updated attendance for ${labors.find(l=>l.id===laborId)?.name} on ${attendanceDate} (${Object.keys(updates).join(', ')})`,
       });
    }

    const existing = laborAttendances.find(a => a.laborId === laborId && a.date === attendanceDate);
    
    if (existing) {
      setLaborAttendances(prev => prev.map(a => 
        a.id === existing.id 
          ? { ...a, ...updates }
          : a
      ));
    } else {
      setLaborAttendances(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          laborId,
          date: attendanceDate,
          status: 'Present',
          overtimeHours: 0,
          ...updates
        } as LaborAttendance
      ]);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-7xl mx-auto px-4 py-8 md:p-8"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6">
        <div>
          <label className="text-xs md:text-xs font-semibold text-orange-500">Personnel</label>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mt-1 text-zinc-900 dark:text-white">Labor Management</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2 font-medium text-sm">Manage daily wage workers, attendance, and overtime payments.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          {isAdmin && (
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsShiftModalOpen(true)}
              className="inline-flex items-center justify-center bg-white/60 dark:bg-[#111] backdrop-blur-md border border-black/10 dark:border-white/10 text-zinc-900 dark:text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-white dark:hover:bg-black transition-colors shadow-sm"
            >
              <Settings className="h-4 w-4 mr-2" />
              Manage Shifts
            </motion.button>
          )}
          {isAdmin && (
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsAuditLogOpen(true)}
              className="inline-flex items-center justify-center bg-white/60 dark:bg-[#111] backdrop-blur-md border border-black/10 dark:border-white/10 text-zinc-900 dark:text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-white dark:hover:bg-black transition-colors shadow-sm"
            >
              <FileText className="h-4 w-4 mr-2" />
              Audit Logs
            </motion.button>
          )}
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsAddLaborModalOpen(true)}
            className="inline-flex items-center justify-center bg-orange-600 px-5 py-2.5 rounded-lg text-sm font-medium text-white hover:bg-orange-700 transition-colors shadow-sm"
          >
            <UserPlus className="h-5 w-5 mr-2 stroke-[2.5]" />
            Add Labor
          </motion.button>
        </div>
      </div>

      {/* Attendance Quick Action Banner */}
      <div className="bg-white/40 dark:bg-black/20 backdrop-blur-xl rounded-[32px] p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between shadow-2xl border border-black/5 dark:border-white/5 mb-8 gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="flex items-center gap-5 relative z-10">
           <div className="h-16 w-16 rounded-[20px] bg-white/60 dark:bg-black/40 border border-black/10 dark:border-white/10 flex items-center justify-center shrink-0 shadow-sm backdrop-blur-md">
             <Clock className="w-8 h-8 text-orange-500" />
           </div>
           <div>
             <h2 className="text-zinc-900 dark:text-white text-xl font-semibold uppercase tracking-tight">Today's Attendance</h2>
             <p className="text-zinc-600 dark:text-zinc-400 font-medium text-sm max-w-sm mt-1">Manage clock-ins and entries for {format(new Date(), 'MMM do, yyyy')}</p>
           </div>
        </div>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsAttendanceModalOpen(true)}
          className="relative z-10 w-full md:w-auto bg-white/60 dark:bg-[#111] backdrop-blur-md border border-black/10 dark:border-white/10 text-zinc-900 dark:text-white px-8 py-5 rounded-xl font-semibold text-sm hover:bg-white dark:hover:bg-black transition-all flex justify-center items-center gap-3 shadow-sm hover:border-orange-500/50 hover:text-orange-500"
        >
          Review & Mark <Clock className="w-4 h-4"/>
        </motion.button>
      </div>

      {/* Monthly Salary Report */}
      <div className="bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-[32px] p-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
              <FileText className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold uppercase tracking-tight text-zinc-900 dark:text-white">Salary Report</h2>
              <p className="text-xs font-semibold text-zinc-500 mt-0.5">Monthly Payouts</p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <input 
              type="month" 
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="flex-1 sm:flex-none bg-white/60 dark:bg-[#111] backdrop-blur-md border border-black/10 dark:border-white/10 rounded-xl px-5 py-4 text-sm font-semibold text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors shadow-sm"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                toast.success(`Exporting report for ${format(parseISO(selectedMonth + '-01'), 'MMMM yyyy')}...`);
                window.location.href = `/export-salary?month=${selectedMonth}`;
              }}
              className="bg-white/60 dark:bg-[#111] backdrop-blur-md border border-black/10 dark:border-white/10 text-zinc-900 dark:text-white p-4 rounded-xl hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-colors shadow-sm"
              title="Export Report"
            >
              <Download className="h-5 w-5" />
            </motion.button>
          </div>
        </div>

        <div className="overflow-x-auto w-full custom-scrollbar">
          <table className="w-full text-sm text-left whitespace-nowrap min-w-[700px]">
            <thead className="bg-black/5 dark:bg-white/5 text-zinc-500 font-semibold text-xs">
              <tr>
                <th className="px-5 py-4 rounded-tl-[16px]">Labor Name</th>
                <th className="px-5 py-4">Daily Rate</th>
                <th className="px-5 py-4">Present Days</th>
                <th className="px-5 py-4">Worked Hrs</th>
                <th className="px-5 py-4">Overtime Hrs</th>
                <th className="px-5 py-4 text-right rounded-tr-[16px]">Total Salary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {monthlySummary.map(({ labor, presentDays, totalWorkedHours, totalOvertimeHours, totalSalary }, idx) => (
                <motion.tr 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={labor.id} 
                  className="hover:bg-white/60 dark:hover:bg-white/5 transition-colors"
                >
                  <td className="px-5 py-4 font-semibold uppercase tracking-tight text-zinc-900 dark:text-white">{labor.name}</td>
                  <td className="px-5 py-4 text-zinc-600 dark:text-zinc-400 font-semibold">₹{labor.dailySalary.toFixed(2)}</td>
                  <td className="px-5 py-4 text-emerald-600 dark:text-emerald-400 font-semibold">{presentDays}</td>
                  <td className="px-5 py-4 text-orange-600 dark:text-orange-400 font-semibold">{formatHM(totalWorkedHours)}</td>
                  <td className="px-5 py-4 text-blue-600 dark:text-blue-400 font-semibold">{formatHM(totalOvertimeHours)}</td>
                  <td className="px-5 py-4 text-right font-semibold text-lg text-zinc-900 dark:text-white">₹{totalSalary.toFixed(2)}</td>
                </motion.tr>
              ))}
              {monthlySummary.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-zinc-500 font-medium">No labors found for this period.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Labors List */}
      <h2 className="text-2xl font-semibold uppercase tracking-tight text-zinc-900 dark:text-white mt-16 mb-8">Active Directory & Time Clock</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {labors.map((labor, idx) => {
          const today = format(new Date(), 'yyyy-MM-dd');
          const todaysAttendance = laborAttendances.find(a => a.laborId === labor.id && a.date === today);
          const isClockedIn = !!(todaysAttendance && todaysAttendance.clockIn && !todaysAttendance.clockOut);
          const hasClockedOut = !!(todaysAttendance && todaysAttendance.clockOut);
          const role = laborRoles.find(r => r.id === labor.roleId);
          const shiftHours = role?.shiftHours || 12;

          return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            key={labor.id} 
            className="bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-[32px] p-6 flex flex-col gap-5 shadow-2xl relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/0 dark:from-white/5 dark:to-white/0 pointer-events-none" />
            
            <div className="flex justify-between items-start relative z-10">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center font-semibold text-orange-500 text-xl group-hover:bg-orange-500 group-hover:text-white transition-colors shrink-0">
                  {labor.name.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-zinc-900 dark:text-white uppercase tracking-tight text-sm mb-0.5">{labor.name}</div>
                  <div className="text-zinc-500 text-xs font-semibold tracking-[0.1em]">{role ? role.name : 'Unknown Role'} • {labor.phone || 'No Phone'}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => toggleLaborStatus(labor.id, labor.status)}
                  className={cn(
                    "inline-flex items-center px-3 py-1.5 rounded-md text-xs font-semibold border mb-2 backdrop-blur-md transition-all active:scale-95",
                    labor.status === 'Active' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20" : "bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-zinc-600 dark:text-zinc-400 hover:bg-black/10 dark:hover:bg-white/10"
                  )}
                >
                  {labor.status}
                </button>
                {isAdmin && (
                  <div className="flex items-center gap-1 mb-2">
                    <button
                      onClick={() => {
                        setEditingLabor(labor);
                        setIsEditLaborModalOpen(true);
                      }}
                      className="p-1.5 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-md hover:bg-blue-500 hover:text-white transition-colors"
                      title="Edit Labor"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => {
                        if(window.confirm('Delete this personnel completely?')) {
                          setLabors(prev => prev.filter(l => l.id !== labor.id));
                        }
                      }}
                      className="p-1.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-md hover:bg-rose-500 hover:text-white transition-colors"
                      title="Delete Labor"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
                  
            <div className="flex items-center justify-between mt-2 pt-5 border-t border-black/5 dark:border-white/5 relative z-10">
              <div>
                <span className="text-xs font-semibold text-zinc-500 text-zinc-500 block mb-1">Daily Fixed Salary</span>
                <span className="font-semibold text-zinc-900 dark:text-white text-lg">₹{labor.dailySalary}</span>
                <span className="text-zinc-500 text-xs font-semibold tracking-[0.1em] ml-1">/ day</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-zinc-500 text-zinc-500 block mb-1">Hourly Rate</span>
                <span className="font-semibold text-zinc-900 dark:text-white text-lg">₹{(labor.dailySalary / shiftHours).toFixed(2)}</span>
                <span className="text-zinc-500 text-xs font-semibold tracking-[0.1em] ml-1">/ hr</span>
              </div>
            </div>
            <div className="mt-2 pt-5 border-t border-black/5 dark:border-white/5 flex flex-col gap-4 relative z-10">
              {/* Timestamp display block */}
              {(isClockedIn || hasClockedOut) && (
                <div className="flex justify-between items-center bg-black/5 dark:bg-white/5 p-4 rounded-xl border border-black/5 dark:border-white/5 backdrop-blur-md">
                   <div className="flex flex-col">
                     <span className="text-xs font-semibold text-zinc-500 mb-1">Clock In</span>
                     <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-sm">
                       {todaysAttendance?.clockIn ? format(parseISO(todaysAttendance.clockIn), 'hh:mm a') : '--:--'}
                     </span>
                   </div>
                   <div className="flex flex-col text-right">
                     <span className="text-xs font-semibold text-zinc-500 mb-1">Clock Out</span>
                     <span className="font-semibold text-rose-600 dark:text-rose-400 text-sm">
                       {todaysAttendance?.clockOut ? format(parseISO(todaysAttendance.clockOut), 'hh:mm a') : '--:--'}
                     </span>
                   </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3">
                {!isClockedIn && !hasClockedOut && (
                  <button
                    onClick={() => openTimeSelector(labor.id, 'in')}
                    className="flex-1 py-4 rounded-xl text-xs font-semibold transition-all bg-emerald-500 text-white hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Clock className="w-4 h-4"/> Clock In
                  </button>
                )}
                {isClockedIn && !hasClockedOut && (
                  <button
                    onClick={() => openTimeSelector(labor.id, 'out')}
                    className="flex-1 py-4 rounded-xl text-xs font-semibold transition-all bg-rose-500 text-white hover:bg-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)] active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Clock className="w-4 h-4"/> Clock Out
                  </button>
                )}
                {hasClockedOut && (
                  <div className="flex-1 py-4 rounded-xl text-xs font-semibold text-center text-zinc-500 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-center justify-center gap-2 backdrop-blur-md">
                     <CheckCircle className="w-4 h-4 text-emerald-500"/> Shift Complete
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )})}
      </div>

      {/* Time Selector Modal */}
      <Modal isOpen={timeSelector.isOpen} onClose={() => setTimeSelector(prev => ({ ...prev, isOpen: false }))} title={timeSelector.type === 'in' ? 'Swipe Clock In' : 'Swipe Clock Out'}>
        <form onSubmit={confirmTimeSelection} className="flex flex-col items-center justify-center p-4 sm:p-6 bg-[#f4f4f5] dark:bg-[#111] rounded-2xl mx-1 mb-2 mt-4">
           <div className="mb-6 w-full flex justify-center">
             <TimeWheelPicker 
               value={timeSelector.timeValue} 
               onChange={newTime => setTimeSelector(prev => ({ ...prev, timeValue: newTime }))} 
             />
           </div>
           
           <p className="text-zinc-500 text-xs font-semibold mb-8 text-center max-w-[280px]">
             Swipe exactly to define arrival and departure time.
           </p>

           <div className="flex gap-4 w-full">
             <button type="button" onClick={() => setTimeSelector(prev => ({ ...prev, isOpen: false }))} className="flex-1 bg-white dark:bg-black text-zinc-600 dark:text-zinc-400 font-semibold py-4 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-900 transition-colors border border-black/5 dark:border-white/10 shadow-sm active:scale-95">
               Cancel
             </button>
             <button type="submit" className={cn("flex-1 text-white font-semibold py-4 rounded-xl transition-colors shadow-lg active:scale-95", timeSelector.type === 'in' ? "bg-emerald-500 hover:bg-emerald-600" : "bg-orange-500 hover:bg-orange-600")}>
               Confirm
             </button>
           </div>
        </form>
      </Modal>

      {/* Add Labor Modal */}
      <Modal isOpen={isAddLaborModalOpen} onClose={() => setIsAddLaborModalOpen(false)} title="Register Labor">
        <form onSubmit={handleAddLabor} className="space-y-6 p-2 md:p-6">
          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-2 px-1">Full Name</label>
            <input type="text" required value={newLabor.name} onChange={e => setNewLabor({...newLabor, name: e.target.value})} className="w-full px-4 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-semibold placeholder:text-zinc-500 shadow-sm" placeholder="e.g. Ramesh Singh" />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-2 px-1">Daily Salary (₹)</label>
              <input type="number" required value={newLabor.dailySalary} onChange={e => setNewLabor({...newLabor, dailySalary: Number(e.target.value)})} className="w-full px-4 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-semibold shadow-sm" placeholder="700" />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-2 px-1">Role & Shift</label>
              <select value={newLabor.roleId} onChange={e => setNewLabor({...newLabor, roleId: e.target.value})} className="w-full px-4 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-semibold shadow-sm appearance-none">
                {laborRoles.map(role => (
                  <option key={role.id} value={role.id}>{role.name} ({role.shiftHours} hr shift)</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-2 px-1">Phone Number</label>
            <input type="tel" value={newLabor.phone} onChange={e => setNewLabor({...newLabor, phone: e.target.value})} className="w-full px-4 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-semibold placeholder:text-zinc-500 shadow-sm" placeholder="+91..." />
          </div>
          <button type="submit" className="w-full bg-orange-500 text-white font-semibold py-5 rounded-xl mt-8 hover:bg-orange-400 transition-colors shadow-[0_0_20px_rgba(249,115,22,0.3)] active:scale-95 text-sm">
            Assign Labor
          </button>
        </form>
      </Modal>

      {/* Edit Labor Modal */}
      <Modal isOpen={isEditLaborModalOpen} onClose={() => { setIsEditLaborModalOpen(false); setEditingLabor(null); }} title="Edit Labor">
        {editingLabor && (
          <form onSubmit={handleEditLaborSubmit} className="space-y-6 p-2 md:p-6">
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-2 px-1">Full Name</label>
              <input type="text" required value={editingLabor.name} onChange={e => setEditingLabor({...editingLabor, name: e.target.value})} className="w-full px-4 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-semibold shadow-sm" />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-2 px-1">Daily Salary (₹)</label>
                <input type="number" required value={editingLabor.dailySalary} onChange={e => setEditingLabor({...editingLabor, dailySalary: Number(e.target.value)})} className="w-full px-4 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-semibold shadow-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-2 px-1">Role & Shift</label>
                <select value={editingLabor.roleId} onChange={e => setEditingLabor({...editingLabor, roleId: e.target.value})} className="w-full px-4 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-semibold shadow-sm appearance-none">
                  {laborRoles.map(role => (
                    <option key={role.id} value={role.id}>{role.name} ({role.shiftHours} hr shift)</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-2 px-1">Phone Number</label>
              <input type="tel" value={editingLabor.phone || ''} onChange={e => setEditingLabor({...editingLabor, phone: e.target.value})} className="w-full px-4 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-semibold shadow-sm" />
            </div>
            <button type="submit" className="w-full bg-blue-500 text-white font-semibold py-5 rounded-xl mt-8 hover:bg-blue-400 transition-colors shadow-[0_0_20px_rgba(59,130,246,0.3)] active:scale-95 text-sm">
              Save Changes
            </button>
          </form>
        )}
      </Modal>

      {/* Mark Attendance Modal */}
      <Modal isOpen={isAttendanceModalOpen} onClose={() => setIsAttendanceModalOpen(false)} title="Daily Attendance" size="full">
        <div className="space-y-6 p-0 md:p-2 bg-transparent">
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-[600px] max-w-full">
            <div className="flex-1">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-2 px-1">Search Labor</label>
              <input 
                type="text" 
                value={attendanceSearchQuery}
                onChange={e => setAttendanceSearchQuery(e.target.value)}
                placeholder="Search by name..."
                className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-semibold shadow-sm" 
              />
            </div>
            <div className="w-48">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-2 px-1">Date</label>
              <input 
                type="date" 
                required 
                value={attendanceDate} 
                onChange={e => setAttendanceDate(e.target.value)} 
                max={format(new Date(), 'yyyy-MM-dd')}
                className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-semibold shadow-sm" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-h-[70vh] overflow-y-auto custom-scrollbar pr-2 pb-10">
             {labors
                .filter(l => l.status === 'Active')
                .filter(l => l.name.toLowerCase().includes(attendanceSearchQuery.toLowerCase()))
                .map(labor => {
                const existingRec = laborAttendances.find(a => a.laborId === labor.id && a.date === attendanceDate);
                const currentStatus = existingRec?.status || 'Absent';
                const role = laborRoles.find(r => r.id === labor.roleId);

                return (
                  <div key={labor.id} className="bg-white/70 dark:bg-[#1a1a1a] backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-[24px] p-5 flex flex-col gap-4 shadow-sm hover:border-black/10 dark:hover:border-white/10 transition-colors">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <div className="font-semibold text-sm text-zinc-900 dark:text-white uppercase tracking-tight mb-0.5">{labor.name}</div>
                        <div className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em]">
                           {role ? `${role.name} (${role.shiftHours} hr shift)` : 'Unknown Role'}
                        </div>
                      </div>
                       <select 
                         value={currentStatus}
                         onChange={(e) => handleMarkAttendance(labor.id, { status: e.target.value as any })}
                         className={cn(
                           "px-3 py-2 rounded-lg text-xs font-semibold text-zinc-500 border focus:outline-none appearance-none cursor-pointer backdrop-blur-md transition-colors shadow-sm",
                           currentStatus === 'Present' ? "bg-emerald-500 text-white border-emerald-500" : 
                           currentStatus === 'Half-Day' ? "bg-orange-500 text-white border-orange-500" : 
                           "bg-white/60 dark:bg-black/40 text-zinc-500 border-black/10 dark:border-white/10"
                         )}
                       >
                         <option value="Present">Present (Default)</option>
                         <option value="Half-Day">Half-Day</option>
                         <option value="Absent">Absent</option>
                       </select>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3">
                       <div className="flex items-center gap-2 bg-white/60 dark:bg-black/40 backdrop-blur-md border border-black/10 dark:border-white/10 rounded-lg px-3 h-[42px] flex-1 min-w-[150px] relative">
                         {!isPinVerified ? (
                           <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/5 dark:bg-white/5 backdrop-blur-[2px] rounded-lg cursor-pointer" onClick={handleUnlockEditing}>
                              <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 flex items-center gap-2">
                                🔒 Unlock
                              </span>
                           </div>
                         ) : null}
                         <span className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] pl-1 mr-auto">Manual Edit</span>
                         <input 
                           type="number"
                           min="0"
                           value={existingRec?.manualHours ?? ''}
                           onChange={(e) => handleMarkAttendance(labor.id, { manualHours: parseInt(e.target.value) || 0 })}
                           className="w-10 bg-transparent text-right font-semibold text-sm text-zinc-900 dark:text-white focus:outline-none"
                           placeholder="0"
                           disabled={!isPinVerified}
                         />
                         <span className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em]">H</span>
                         <input 
                           type="number"
                           min="0" max="59"
                           value={existingRec?.manualMinutes ?? ''}
                           onChange={(e) => handleMarkAttendance(labor.id, { manualMinutes: parseInt(e.target.value) || 0 })}
                           className="w-8 bg-transparent text-right font-semibold text-sm text-zinc-900 dark:text-white focus:outline-none"
                           placeholder="0"
                           disabled={!isPinVerified}
                         />
                         <span className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] pr-1">M</span>
                       </div>
                    </div>

                    {(existingRec?.clockIn || existingRec?.clockOut || isAdmin) && (
                      <div className="flex flex-col gap-3 text-xs font-semibold text-zinc-500 border-t border-black/5 dark:border-white/5 pt-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-zinc-400" />
                          <span className="uppercase tracking-widest text-[10px]">Clock Settings</span>
                        </div>
                        
                        {isAdmin ? (
                          <div className="flex items-center gap-2 relative flex-wrap">
                            {!isPinVerified ? (
                              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/5 dark:bg-white/5 backdrop-blur-[2px] rounded-lg cursor-pointer" onClick={handleUnlockEditing}>
                                <span className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-300">🔒 Unlock</span>
                              </div>
                            ) : null}
                            <TimePicker12 
                               value={existingRec?.clockIn} 
                               onChange={(val) => handleMarkAttendance(labor.id, { clockIn: val })} 
                               disabled={!isPinVerified}
                            />
                            <span className="text-zinc-400">→</span>
                            <TimePicker12 
                               value={existingRec?.clockOut} 
                               onChange={(val) => handleMarkAttendance(labor.id, { clockOut: val })} 
                               disabled={!isPinVerified}
                            />
                          </div>
                        ) : (
                          <span className="font-mono">
                            {existingRec?.clockIn ? format(parseISO(existingRec.clockIn), 'hh:mm a') : '--'} → {existingRec?.clockOut ? format(parseISO(existingRec.clockOut), 'hh:mm a') : '--'}
                          </span>
                        )}

                        {(existingRec?.clockIn && existingRec?.clockOut) || (existingRec?.manualHours !== undefined) ? (() => {
                          const shiftHours = role?.shiftHours || 12;
                          let diff = 0;
                          
                          if (existingRec?.manualHours !== undefined || existingRec?.manualMinutes !== undefined) {
                             diff = (existingRec.manualHours || 0) + ((existingRec.manualMinutes || 0) / 60);
                          } else if (existingRec?.clockIn && existingRec?.clockOut) {
                             const inTime = new Date(existingRec.clockIn).getTime();
                             const outTime = new Date(existingRec.clockOut).getTime();
                             if (!isNaN(inTime) && !isNaN(outTime)) {
                                diff = (outTime - inTime) / (1000 * 60 * 60);
                                if (diff < 0) diff += 24;
                             }
                          }
                          
                          if (diff <= 0) return null;
                          
                          const isOvertime = diff > shiftHours;
                          const overtimeHours = isOvertime ? (diff - shiftHours) : 0;
                          const workingHours = isOvertime ? shiftHours : diff;
                          
                          const formatHM_local = (decimalHours: number) => {
                            const h = Math.floor(decimalHours);
                            const m = Math.round((decimalHours - h) * 60);
                            if (h > 0 && m > 0) return `${h}h ${m}m`;
                            if (h > 0) return `${h}h`;
                            if (decimalHours === 0) return `0h`;
                            return `${m}m`;
                          };
                          
                          return (
                            <div className="mt-2 flex items-center gap-2 flex-wrap bg-black/5 dark:bg-white/5 p-2 rounded-xl">
                               <span className="text-zinc-600 dark:text-zinc-400 font-bold px-2 py-1 text-xs uppercase tracking-wider">
                                 Work: {formatHM_local(workingHours)}
                               </span>
                               {isOvertime && (
                                 <span className="text-orange-500 font-bold bg-orange-500/10 px-2 py-1 rounded-[6px] text-xs tracking-wider uppercase">
                                   OT: + {formatHM_local(overtimeHours)}
                                 </span>
                               )}
                               <span className="ml-auto font-bold px-2 py-1 text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded-[6px]">
                                 Tot: {formatHM_local(diff)}
                               </span>
                            </div>
                          );
                        })() : null}
                      </div>
                    )}
                  </div>
                )
             })}
             {labors.filter(l => l.status === 'Active').length === 0 && (
               <p className="text-sm text-zinc-500 font-medium px-1 col-span-full">No active labors found. Add labors first.</p>
             )}
          </div>
        </div>
      </Modal>

      {/* Manage Shifts Modal */}
      <Modal isOpen={isShiftModalOpen} onClose={() => setIsShiftModalOpen(false)} title="Manage Shifts" size="lg">
        <div className="p-2 md:p-6 space-y-6">
          <form onSubmit={handleAddShift} className="bg-white/40 dark:bg-black/20 p-4 rounded-[24px] border border-black/5 dark:border-white/5 space-y-4">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-tight">Create New Shift</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-2 px-1">Shift Name</label>
                <input type="text" required value={newShift.name} onChange={e => setNewShift({...newShift, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 font-semibold text-sm" placeholder="e.g. Contract Worker" />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-2 px-1">Shift Hours</label>
                <input type="number" step="0.5" min="1" required value={newShift.shiftHours} onChange={e => setNewShift({...newShift, shiftHours: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 font-semibold text-sm" placeholder="e.g. 9" />
              </div>
            </div>
            <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm py-3 rounded-xl transition-colors">
              Add Shift Role
            </button>
          </form>

          <div className="space-y-3 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest px-1">Active Shifts</h3>
            {laborRoles.map(role => (
              <div key={role.id} className="flex justify-between items-center bg-white/60 dark:bg-[#111] backdrop-blur-md border border-black/5 dark:border-white/5 rounded-2xl p-4 shadow-sm">
                <div>
                  <div className="font-semibold text-zinc-900 dark:text-white text-sm">{role.name}</div>
                  <div className="text-xs font-semibold text-zinc-500 mt-1 uppercase tracking-wider">{role.shiftHours} Hours / Shift</div>
                </div>
                <button
                  onClick={() => handleDeleteShift(role.id)}
                  className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                  title="Delete Shift"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Admin Audit Logs Modal */}
      {isAdmin && (
        <Modal isOpen={isAuditLogOpen} onClose={() => setIsAuditLogOpen(false)} title="Labor Audit Logs" size="xl">
          <div className="p-2 md:p-6 space-y-4">
            <p className="text-sm font-medium text-zinc-500 mb-4 px-1">Transparent history of all manual edits and overrides made by administrators in the Labor module.</p>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
               {activityLogs.filter(log => log.module === 'Labor').reverse().map(log => (
                 <div key={log.id} className="bg-white/40 dark:bg-black/20 backdrop-blur-md border border-black/5 dark:border-white/5 rounded-2xl p-4 flex flex-col gap-2">
                   <div className="flex justify-between items-start gap-4">
                     <span className="font-semibold text-zinc-900 dark:text-white text-sm">{log.action}</span>
                     <span className="text-xs font-semibold text-zinc-400 shrink-0">{format(parseISO(log.timestamp), 'MMM do, h:mm a')}</span>
                   </div>
                   <p className="text-sm text-zinc-600 dark:text-zinc-300 font-medium">{log.details}</p>
                   <div className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mt-1">By: {log.userName}</div>
                 </div>
               ))}
               {activityLogs.filter(log => log.module === 'Labor').length === 0 && (
                 <div className="text-center py-8 text-zinc-500 font-medium text-sm border border-dashed border-black/10 dark:border-white/10 rounded-2xl">
                    No manual overrides or edits recorded yet.
                 </div>
               )}
            </div>
          </div>
        </Modal>
      )}
    </motion.div>
  );
}
