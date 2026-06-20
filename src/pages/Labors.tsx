import React, { useState, useMemo } from 'react';
import { useDataStore } from '../store/data';
import { Users, UserPlus, Clock, IndianRupee, FileText, Download, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import Modal from '../components/ui/Modal';
import TimeWheelPicker from '../components/TimeWheelPicker';
import { Labor, LaborAttendance } from '../types';
import { cn } from '../lib/utils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';

export default function Labors() {
  const { labors, setLabors, laborAttendances, setLaborAttendances, roles } = useDataStore();
  const [isAddLaborModalOpen, setIsAddLaborModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  
  const [newLabor, setNewLabor] = useState<Partial<Labor>>({
    name: '', dailySalary: 700, phone: '', status: 'Active', gender: 'Male'
  });

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
    
    const labor: Labor = {
      id: Math.random().toString(),
      name: newLabor.name,
      dailySalary: Number(newLabor.dailySalary),
      phone: newLabor.phone || '',
      status: 'Active',
      joinDate: new Date().toISOString(),
      gender: newLabor.gender || 'Male'
    };
    
    setLabors(prev => [...prev, labor]);
    toast.success(`Labor ${labor.name} added successfully.`);
    setIsAddLaborModalOpen(false);
    setNewLabor({ name: '', dailySalary: 700, phone: '', status: 'Active', gender: 'Male' });
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

      const threshold = labor.gender === 'Female' ? 9.5 : 12;
      const hourlyRate = labor.dailySalary / threshold;
      
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
           const inDate = new Date(a.clockIn);
           const outDate = new Date(a.clockOut);
           dailyHours = (outDate.getTime() - inDate.getTime()) / (1000 * 60 * 60);
           if (dailyHours > 0) isPresent = true;
        } else if (a.status === 'Present') {
           dailyHours = threshold;
           if (a.overtimeHours) dailyHours += a.overtimeHours;
           isPresent = true;
        } else if (a.status === 'Half-Day') {
           dailyHours = threshold / 2;
        }

        if (isPresent) presentDays++;
        
        totalWorkedHours += dailyHours;
        
        if (dailyHours > threshold) {
          totalOvertimeHours += (dailyHours - threshold);
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
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-8 md:p-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6">
        <div>
          <label className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-orange-500">Personnel</label>
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight mt-1 text-zinc-900 dark:text-white">Labor Management</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2 font-medium text-sm">Manage daily wage workers, attendance, and overtime payments.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            onClick={() => setIsAddLaborModalOpen(true)}
            className="inline-flex items-center justify-center bg-white dark:bg-black px-6 py-3 md:py-4 rounded-xl text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors shadow-lg active:scale-95 border border-black/5 dark:border-white/10"
          >
            <UserPlus className="h-5 w-5 mr-2" />
            Add Labor
          </button>
        </div>
      </div>

      {/* Attendance Quick Action Banner */}
      <div className="bg-white dark:bg-[#111] rounded-2xl p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between shadow-sm border border-orange-500/20 mb-8 gap-4">
        <div className="flex items-center gap-4">
           <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
             <Clock className="w-6 h-6 text-orange-500" />
           </div>
           <div>
             <h2 className="text-zinc-900 dark:text-white text-lg font-black uppercase tracking-tight">Today's Attendance</h2>
             <p className="text-zinc-500 dark:text-zinc-400 font-medium text-xs max-w-sm mt-0.5">Manage clock-ins and entries for {format(new Date(), 'MMM do, yyyy')}</p>
           </div>
        </div>
        <button 
          onClick={() => setIsAttendanceModalOpen(true)}
          className="w-full md:w-auto bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:opacity-80 active:scale-95 transition-all flex justify-center items-center gap-2"
        >
          Review & Mark <Clock className="w-4 h-4"/>
        </button>
      </div>

      {/* Monthly Salary Report */}
      <div className="bg-[#f4f4f5] dark:bg-[#111] border border-black/5 dark:border-white/10 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight text-zinc-900 dark:text-white">Salary Report</h2>
              <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Monthly Payouts</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input 
              type="month" 
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="flex-1 sm:flex-none bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500"
            />
            <button
              onClick={() => toast.success(`Exporting report for ${format(parseISO(selectedMonth + '-01'), 'MMMM yyyy')}...`)}
              className="bg-white dark:bg-black border border-black/5 dark:border-white/10 text-zinc-900 dark:text-white p-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors shadow-sm"
              title="Export Report"
            >
              <Download className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm text-left whitespace-nowrap min-w-[700px]">
            <thead className="bg-white/50 dark:bg-black/50 text-zinc-500 font-bold uppercase tracking-widest text-[10px]">
              <tr>
                <th className="px-4 py-3 rounded-l-xl">Labor Name</th>
                <th className="px-4 py-3">Daily Rate</th>
                <th className="px-4 py-3">Present Days</th>
                <th className="px-4 py-3">Worked Hrs</th>
                <th className="px-4 py-3">Overtime Hrs</th>
                <th className="px-4 py-3 text-right rounded-r-xl">Total Salary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {monthlySummary.map(({ labor, presentDays, totalWorkedHours, totalOvertimeHours, totalSalary }) => (
                <tr key={labor.id}>
                  <td className="px-4 py-4 font-bold text-zinc-900 dark:text-white">{labor.name}</td>
                  <td className="px-4 py-4 text-zinc-600 dark:text-zinc-400 font-mono">₹{labor.dailySalary.toFixed(2)}</td>
                  <td className="px-4 py-4 text-emerald-600 dark:text-emerald-400 font-bold">{presentDays}</td>
                  <td className="px-4 py-4 text-orange-600 dark:text-orange-400 font-bold">{totalWorkedHours.toFixed(1)}h</td>
                  <td className="px-4 py-4 text-blue-600 dark:text-blue-400 font-bold">{totalOvertimeHours.toFixed(1)}h</td>
                  <td className="px-4 py-4 text-right font-black text-lg text-zinc-900 dark:text-white">₹{totalSalary.toFixed(2)}</td>
                </tr>
              ))}
              {monthlySummary.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-zinc-500 font-medium">No labors found for this period.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Labors List */}
      <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900 dark:text-white mt-12 mb-6">Active Directory & Time Clock</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {labors.map((labor) => {
          const today = format(new Date(), 'yyyy-MM-dd');
          const todaysAttendance = laborAttendances.find(a => a.laborId === labor.id && a.date === today);
          const isClockedIn = !!(todaysAttendance && todaysAttendance.clockIn && !todaysAttendance.clockOut);
          const hasClockedOut = !!(todaysAttendance && todaysAttendance.clockOut);

          return (
          <div key={labor.id} className="bg-[#f4f4f5] dark:bg-[#111] border border-black/5 dark:border-white/5 rounded-2xl p-5 flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center font-black text-zinc-900 dark:text-white text-lg">
                  {labor.name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-zinc-900 dark:text-white uppercase text-sm mb-0.5">{labor.name}</div>
                  <div className="text-zinc-500 text-[10px] font-bold tracking-widest">{labor.phone || 'No Phone'}</div>
                </div>
              </div>
              <button 
                onClick={() => toggleLaborStatus(labor.id, labor.status)}
                className={cn(
                  "inline-flex items-center px-2 py-1 rounded-[6px] text-[9px] font-bold uppercase tracking-wider border mb-2",
                  labor.status === 'Active' ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" : "bg-black/10 dark:bg-white/10 border-black/10 dark:border-white/20 text-zinc-600 dark:text-zinc-400"
                )}
              >
                {labor.status}
              </button>
            </div>
                  
            <div className="flex items-center justify-between mt-2 pt-4 border-t border-black/5 dark:border-white/5">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-1">Daily Fixed Salary</span>
                <span className="font-black text-zinc-900 dark:text-white">₹{labor.dailySalary}</span>
                <span className="text-zinc-500 text-[10px] font-bold tracking-widest ml-1">/ day</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-1">Hourly Rate</span>
                <span className="font-bold text-zinc-900 dark:text-white">₹{(labor.dailySalary / (labor.gender === 'Female' ? 9.5 : 12)).toFixed(2)}</span>
                <span className="text-zinc-500 text-[10px] font-bold tracking-widest ml-1">/ hr</span>
              </div>
            </div>
            <div className="mt-2 pt-4 border-t border-black/5 dark:border-white/5 flex flex-col gap-3">
              {/* Timestamp display block */}
              {(isClockedIn || hasClockedOut) && (
                <div className="flex justify-between items-center bg-black/5 dark:bg-white/5 p-3 rounded-xl border border-black/5 dark:border-white/5">
                   <div className="flex flex-col">
                     <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-0.5">Clock In</span>
                     <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                       {todaysAttendance?.clockIn ? format(parseISO(todaysAttendance.clockIn), 'hh:mm a') : '--:--'}
                     </span>
                   </div>
                   <div className="flex flex-col text-right">
                     <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-0.5">Clock Out</span>
                     <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-sm">
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
                    className="flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Clock className="w-4 h-4"/> Clock In
                  </button>
                )}
                {isClockedIn && !hasClockedOut && (
                  <button
                    onClick={() => openTimeSelector(labor.id, 'out')}
                    className="flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/20 active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Clock className="w-4 h-4"/> Clock Out
                  </button>
                )}
                {hasClockedOut && (
                  <div className="flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest text-center text-zinc-500 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-center justify-center gap-2">
                     <CheckCircle className="w-4 h-4 text-emerald-500"/> Shift Complete
                  </div>
                )}
              </div>
            </div>
          </div>
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
           
           <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-8 text-center max-w-[280px]">
             Swipe exactly to define arrival and departure time.
           </p>

           <div className="flex gap-4 w-full">
             <button type="button" onClick={() => setTimeSelector(prev => ({ ...prev, isOpen: false }))} className="flex-1 bg-white dark:bg-black text-zinc-600 dark:text-zinc-400 font-black uppercase tracking-widest py-4 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-900 transition-colors border border-black/5 dark:border-white/10 shadow-sm active:scale-95">
               Cancel
             </button>
             <button type="submit" className={cn("flex-1 text-white font-black uppercase tracking-widest py-4 rounded-xl transition-colors shadow-lg active:scale-95", timeSelector.type === 'in' ? "bg-emerald-500 hover:bg-emerald-600" : "bg-orange-500 hover:bg-orange-600")}>
               Confirm
             </button>
           </div>
        </form>
      </Modal>

      {/* Add Labor Modal */}
      <Modal isOpen={isAddLaborModalOpen} onClose={() => setIsAddLaborModalOpen(false)} title="Register Labor">
        <form onSubmit={handleAddLabor} className="space-y-5">
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Full Name</label>
            <input type="text" required value={newLabor.name} onChange={e => setNewLabor({...newLabor, name: e.target.value})} className="w-full px-4 py-4 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-black text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-medium placeholder:text-zinc-600" placeholder="e.g. Ramesh Singh" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Daily Salary (₹)</label>
              <input type="number" required value={newLabor.dailySalary} onChange={e => setNewLabor({...newLabor, dailySalary: Number(e.target.value)})} className="w-full px-4 py-4 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-black text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-medium" placeholder="700" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Gender (Shift)</label>
              <select value={newLabor.gender} onChange={e => setNewLabor({...newLabor, gender: e.target.value as 'Male'|'Female'})} className="w-full px-4 py-4 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-black text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-medium">
                <option value="Male">Male (12 hr shift)</option>
                <option value="Female">Female (9.5 hr shift)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Phone Number</label>
            <input type="tel" value={newLabor.phone} onChange={e => setNewLabor({...newLabor, phone: e.target.value})} className="w-full px-4 py-4 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-black text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-medium placeholder:text-zinc-600" placeholder="+91..." />
          </div>
          <button type="submit" className="w-full bg-white text-black font-black uppercase tracking-widest py-4 rounded-xl mt-4 hover:bg-zinc-200 transition-colors shadow-lg active:scale-[0.98]">
            Assign Labor
          </button>
        </form>
      </Modal>

      {/* Mark Attendance Modal */}
      <Modal isOpen={isAttendanceModalOpen} onClose={() => setIsAttendanceModalOpen(false)} title="Daily Attendance">
        <div className="space-y-6">
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Attendance Date</label>
            <input 
              type="date" 
              required 
              value={attendanceDate} 
              onChange={e => setAttendanceDate(e.target.value)} 
              max={format(new Date(), 'yyyy-MM-dd')}
              className="w-full px-4 py-4 rounded-xl border border-black/5 dark:border-white/10 bg-[#f4f4f5] dark:bg-[#111] text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-medium" 
            />
          </div>

          <div className="space-y-3">
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Labors List</h3>
             {labors.filter(l => l.status === 'Active').map(labor => {
                const existingRec = laborAttendances.find(a => a.laborId === labor.id && a.date === attendanceDate);
                const currentStatus = existingRec?.status || 'Absent';

                return (
                  <div key={labor.id} className="bg-white dark:bg-black border border-black/5 dark:border-white/10 rounded-xl p-4 flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <div className="font-bold text-sm text-zinc-900 dark:text-white uppercase">{labor.name}</div>
                      <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                         {labor.gender === 'Female' ? '9.5 hr shift' : '12 hr shift'}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                       <select 
                         value={currentStatus}
                         onChange={(e) => handleMarkAttendance(labor.id, { status: e.target.value as any })}
                         className={cn(
                           "px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-widest border focus:outline-none appearance-none cursor-pointer",
                           currentStatus === 'Present' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : 
                           currentStatus === 'Half-Day' ? "bg-orange-500/10 text-orange-500 border-orange-500/20" : 
                           "bg-zinc-100 dark:bg-zinc-900 text-zinc-500 border-zinc-200 dark:border-zinc-800"
                         )}
                       >
                         <option value="Present">Present (Default)</option>
                         <option value="Half-Day">Half-Day</option>
                         <option value="Absent">Absent</option>
                       </select>

                       <div className="flex items-center gap-1 bg-zinc-50 dark:bg-zinc-900 border border-black/5 dark:border-white/5 rounded-lg px-2 h-9 flex-1">
                         <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1 mr-auto">Manual</span>
                         <input 
                           type="number"
                           min="0"
                           value={existingRec?.manualHours ?? ''}
                           onChange={(e) => handleMarkAttendance(labor.id, { manualHours: parseInt(e.target.value) || 0 })}
                           className="w-10 bg-transparent text-right font-bold text-sm text-zinc-900 dark:text-white focus:outline-none"
                           placeholder="0"
                         />
                         <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">H</span>
                         <input 
                           type="number"
                           min="0" max="59"
                           value={existingRec?.manualMinutes ?? ''}
                           onChange={(e) => handleMarkAttendance(labor.id, { manualMinutes: parseInt(e.target.value) || 0 })}
                           className="w-8 bg-transparent text-right font-bold text-sm text-zinc-900 dark:text-white focus:outline-none"
                           placeholder="0"
                         />
                         <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pr-1">M</span>
                       </div>
                    </div>

                    {(existingRec?.clockIn || existingRec?.clockOut) && (
                      <div className="flex items-center gap-2 text-[10px] font-medium text-zinc-500 border-t border-black/5 dark:border-white/5 pt-2 mt-1">
                        <Clock className="w-3 h-3" />
                        Card Swipe: {existingRec.clockIn ? format(parseISO(existingRec.clockIn), 'HH:mm') : '--'} to {existingRec.clockOut ? format(parseISO(existingRec.clockOut), 'HH:mm') : '--'}
                        {existingRec.clockIn && existingRec.clockOut && (
                          <span className="ml-auto text-emerald-600 dark:text-emerald-400 font-bold">
                            Total: {((new Date(existingRec.clockOut).getTime() - new Date(existingRec.clockIn).getTime()) / (1000 * 60 * 60)).toFixed(1)} hrs
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )
             })}
             {labors.filter(l => l.status === 'Active').length === 0 && (
               <p className="text-sm text-zinc-500 font-medium px-1">No active labors found. Add labors first.</p>
             )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
