import React, { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDataStore } from '../store/data';
import { startOfMonth, endOfMonth, parseISO, format } from 'date-fns';

const formatHM = (decimalHours: number) => {
  const h = Math.floor(decimalHours);
  const m = Math.round((decimalHours - h) * 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  if (decimalHours === 0) return `0h`;
  return `${m}m`;
};

export default function ExportSalaryReport() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const selectedMonth = searchParams.get('month') || format(new Date(), 'yyyy-MM');

  const { labors, laborAttendances, laborRoles } = useDataStore();
  
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
           const inDate = new Date(a.clockIn).getTime();
           const outDate = new Date(a.clockOut).getTime();
           if (!isNaN(inDate) && !isNaN(outDate)) {
              dailyHours = (outDate - inDate) / (1000 * 60 * 60);
              if (dailyHours < 0) dailyHours += 24; // Handle overnight shifts
           }
           if (dailyHours > 0) isPresent = true;
        } else if (a.clockIn && !a.clockOut) {
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
    }).filter(s => s.presentDays > 0 || s.labor.status === 'Active');
  }, [labors, laborAttendances, laborRoles, selectedMonth]);

  const handlePrint = () => {
    window.print();
  };

  const totalPayout = monthlySummary.reduce((acc, curr) => acc + curr.totalSalary, 0);
  const monthLabel = format(parseISO(selectedMonth + '-01'), 'MMMM yyyy');

  return (
    <div className="bg-[#111] min-h-screen text-[#1d1d1b] font-sans relative p-4 md:p-8">
      <div className="print:hidden fixed top-4 right-4 md:top-8 md:right-8 z-50 flex gap-3">
        <button 
          onClick={() => navigate(-1)} 
          className="bg-white/10 backdrop-blur-md text-white px-4 py-2 rounded-xl text-xs font-semibold text-zinc-500 hover:bg-white/20 transition-colors flex items-center gap-2 shadow-lg border border-white/10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Back
        </button>
        <button 
          onClick={handlePrint}
          className="bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-semibold text-zinc-500 hover:bg-orange-700 transition-colors flex items-center gap-2 shadow-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          Download PDF
        </button>
      </div>

      <div className="flex justify-center w-full overflow-x-auto print:overflow-visible print:block pb-10 print:pb-0 relative">
        <div className="invoice-container w-[794px] min-h-[1123px] mx-auto bg-[#f0ece1] p-12 md:p-16 relative flex flex-col shadow-2xl shrink-0 print:shadow-none print:w-[100%] print:min-h-auto">
          {/* Top Header */}
          <div className="flex justify-between items-start mb-12 text-xs md:text-xs font-semibold text-zinc-500 leading-relaxed border-b-2 border-black pb-6">
            <div>(metamorphmetal.com)</div>
            <div className="text-center">
              +91 99986 28121<br/>
              sales@metamorphmetal.com
            </div>
            <div className="text-right max-w-[320px]">
              B-24, Atmiya 2 Industrial Park, Bamangam,<br/>
              Tal. Karjan, Dist. Vadodara - 391243
            </div>
          </div>

          <div className="flex justify-between items-end mb-10">
            <div>
              <h1 className="text-4xl font-semibold uppercase tracking-tighter leading-none text-zinc-900 mb-2">Monthly Labour Sheet</h1>
              <div className="text-sm font-medium text-zinc-600">Period: {monthLabel}</div>
            </div>
            <div className="text-right">
              <div className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-1">Total Payout</div>
              <div className="text-2xl font-bold tracking-tight">₹{totalPayout.toFixed(2)}</div>
            </div>
          </div>

          <div className="w-full">
            <div className="grid grid-cols-6 border-b-2 border-black pb-3 mb-4 text-[11px] font-bold uppercase tracking-wider">
              <div className="col-span-2">Labor Name</div>
              <div className="text-right">Rate/Day</div>
              <div className="text-right">Days</div>
              <div className="text-right">Hrs (OT)</div>
              <div className="text-right">Total Salary</div>
            </div>
            
            <div className="space-y-3 text-sm font-medium">
              {monthlySummary.map(({ labor, presentDays, totalWorkedHours, totalOvertimeHours, totalSalary }, i) => (
                <div key={labor.id} className="grid grid-cols-6 border-b border-black/10 pb-3">
                  <div className="col-span-2 font-semibold uppercase">{labor.name} {labor.status !== 'Active' && <span className="text-[10px] text-zinc-400 bg-black/5 px-1 py-0.5 rounded ml-1">INACTIVE</span>}</div>
                  <div className="text-right text-zinc-600">₹{labor.dailySalary}</div>
                  <div className="text-right">{presentDays}</div>
                  <div className="text-right">{formatHM(totalWorkedHours)} <span className="text-[10px] text-zinc-500">({formatHM(totalOvertimeHours)})</span></div>
                  <div className="text-right font-bold tracking-tight">₹{totalSalary.toFixed(2)}</div>
                </div>
              ))}
              {monthlySummary.length === 0 && (
                <div className="text-center text-zinc-500 py-10 font-medium">No labour records found for this month.</div>
              )}
            </div>
          </div>

          <div className="mt-auto pt-10">
            <div className="flex justify-between border-t-2 border-black pt-6 pb-20">
               <div>
                 <div className="h-16 w-32 border-b border-black border-dashed mb-2"></div>
                 <div className="text-xs font-medium text-zinc-500 uppercase">Prepared By</div>
               </div>
               <div>
                 <div className="h-16 w-32 border-b border-black border-dashed mb-2"></div>
                 <div className="text-xs font-medium text-zinc-500 uppercase">Authorised Signatory</div>
               </div>
            </div>
            
            {/* Footer Graphic */}
            <div className="w-full flex justify-center opacity-[0.08] pointer-events-none -mb-16">
               <svg viewBox="0 0 1300 350" className="w-[110%] h-auto text-black" preserveAspectRatio="xMidYMid meet">
                  <text x="50%" y="54%" dominantBaseline="central" textAnchor="middle" fontSize="200" fontWeight="900" fontFamily="system-ui, sans-serif" fill="currentColor" letterSpacing="-0.02em">
                     METAMORPH
                  </text>
               </svg>
            </div>
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { background-color: #f0ece1 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}} />
    </div>
  );
}
