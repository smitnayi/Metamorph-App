import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDataStore } from '../store/data';
import { format, subDays, isAfter, isSameDay, parseISO } from 'date-fns';
import { downloadPdf } from '../lib/pdf';

export default function ExportLabReport() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const range = searchParams.get('range') || '1d';
  const { labRoutineChecks } = useDataStore();

  const filteredChecks = useMemo(() => {
    const today = new Date();
    let startDate: Date;
    switch(range) {
      case '1w': startDate = subDays(today, 7); break;
      case '1m': startDate = subDays(today, 30); break;
      case '1d': 
      default: startDate = today; break;
    }

    return labRoutineChecks.filter(check => {
      const checkDate = parseISO(check.date);
      if (range === '1d') return isSameDay(checkDate, today);
      return isAfter(checkDate, startDate) || isSameDay(checkDate, startDate);
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [labRoutineChecks, range]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-[#111] min-h-screen text-[#1a1a1a] font-sans relative p-4 md:p-8">
      <div className="print:hidden fixed top-4 right-4 md:top-8 md:right-8 z-50 flex gap-3">
        <button 
          onClick={() => navigate(-1)} 
          className="bg-white/10 backdrop-blur-md text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/20 transition-colors flex items-center gap-2 shadow-lg border border-white/10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Back
        </button>
        <button 
          onClick={handlePrint}
          className="bg-orange-500 text-black px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-orange-600 transition-colors flex items-center gap-2 shadow-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          Download PDF
        </button>
      </div>

      <div className="flex justify-center w-full overflow-x-auto print:overflow-visible print:block pb-10 print:pb-0 relative">
        <div className="lab-report-container w-[1123px] min-h-[794px] bg-[#f5f4f0] p-16 relative flex flex-col justify-between shadow-2xl shrink-0 print:shadow-none print:w-full print:h-full print:min-h-0 print:bg-white origin-top">
           <div className="flex-1">
              {/* HEADER */}
              <div className="flex justify-between items-start text-[10px] md:text-xs font-bold uppercase tracking-widest border-b-2 border-[#1a1a1a] pb-6 mb-12">
                 <div>(metamorph-lab)</div>
                 <div className="text-center">
                   +91 99986 28121<br/>
                   sales@metamorphmetal.com
                 </div>
                 <div className="text-right max-w-[320px]">
                   B-24, Atmiya 2 Industrial Park, Bamangam,<br/>
                   Tal. Karjan, Dist. Vadodara - 391243
                 </div>
              </div>

              {/* INFOBAR */}
              <div className="flex justify-between items-start mb-16">
                 <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                    <div>
                       <div className="text-[10px] font-bold uppercase tracking-widest mb-1">GENERATED ON:</div>
                       <div className="text-sm font-medium">{format(new Date(), 'dd MMM yyyy, HH:mm')}</div>
                    </div>
                    <div>
                       <div className="text-[10px] font-bold uppercase tracking-widest mb-1">RECORD RANGE:</div>
                       <div className="text-sm font-medium">
                          {range === '1d' ? 'Today' : range === '1w' ? 'Last 7 Days' : 'Last 30 Days'}
                       </div>
                    </div>
                    <div>
                       <div className="text-[10px] font-bold uppercase tracking-widest mb-1">TOTAL RECORDS:</div>
                       <div className="text-sm font-medium">{filteredChecks.length} Routine Checks</div>
                    </div>
                    <div>
                       <div className="text-[10px] font-bold uppercase tracking-widest mb-1">LAB MANAGER:</div>
                       <div className="text-sm font-medium">System Automated</div>
                    </div>
                 </div>
                 
                 <div className="text-right">
                    <h1 className="text-[80px] font-black uppercase tracking-tighter leading-[0.85] text-[#1a1a1a]">
                      LAB<br/>REPORT
                    </h1>
                 </div>
              </div>

              {/* TABLE */}
              <div className="mb-12">
                 <table className="w-full text-left border-collapse">
                    <thead>
                       <tr className="border-b-2 border-[#1a1a1a] text-[10px] font-black uppercase tracking-widest">
                          <th className="py-4 px-2">Date</th>
                          <th className="py-4 px-2">Inspector</th>
                          <th className="py-4 px-2">Degrease<br/>(Alkali)</th>
                          <th className="py-4 px-2">Desmut<br/>(Acid)</th>
                          <th className="py-4 px-2 text-orange-600">Al Coating<br/>(Acid / Free)</th>
                          <th className="py-4 px-2 text-orange-600">Al Coating<br/>(Time)</th>
                          <th className="py-4 px-2">Final Rinse<br/>(pH / Cond)</th>
                       </tr>
                    </thead>
                    <tbody>
                       {filteredChecks.map((check, i) => (
                         <tr key={check.id} className="border-b border-[#1a1a1a]/20 text-sm font-medium">
                            <td className="py-4 px-2 font-mono text-xs">{format(parseISO(check.date), 'MM/dd')}</td>
                            <td className="py-4 px-2">{check.inspectorName}</td>
                            <td className="py-4 px-2">{check.degreaseAlkali} ml</td>
                            <td className="py-4 px-2">{check.desmutAcid} ml</td>
                            <td className="py-4 px-2 font-bold text-orange-600 bg-orange-500/10">{check.alCoatingAcid} / {check.alCoatingFreeAcid}</td>
                            <td className="py-4 px-2 font-bold text-orange-600 bg-orange-500/10">{check.alCoatingTime} min</td>
                            <td className="py-4 px-2">{check.rinse4pH} pH / {check.rinse4Cond} µS</td>
                         </tr>
                       ))}
                       {filteredChecks.length === 0 && (
                          <tr>
                             <td colSpan={7} className="py-8 text-center text-zinc-500 text-sm uppercase tracking-widest font-bold">No records found for this period.</td>
                          </tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </div>

           {/* FOOTER GRAPHIC */}
           <div className="relative mt-auto border-t-2 border-[#1a1a1a] pt-12 overflow-hidden">
              <div className="text-[10px] font-bold uppercase tracking-widest mb-12">
                 End of report. Please maintain records for quality audits.
              </div>
              
              <div className="w-full flex justify-center opacity-[0.15] pointer-events-none -mb-16">
                 <svg viewBox="0 0 1300 350" className="w-[110%] h-auto text-orange-500" preserveAspectRatio="xMidYMid meet">
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
          @page { size: A4 landscape; margin: 0; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: white !important; }
        }
      `}} />
    </div>
  );
}
