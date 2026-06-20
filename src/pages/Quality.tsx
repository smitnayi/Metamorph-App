import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Card, CardContent } from '../components/ui/Card';
import { useDataStore } from '../store/data';
import { ShieldAlert, CheckCircle, XCircle, Search, ClipboardSignature, ArrowLeft, Image as ImageIcon, Printer, Tag, Plus, Camera, Mail } from 'lucide-react';
import { cn } from '../lib/utils';
import { QualityCheck, Order } from '../types';
import Modal from '../components/ui/Modal';
import { toast } from 'sonner';
import { downloadPdf } from '../lib/pdf';

export default function Quality() {
  const [isAddingMode, setIsAddingMode] = useState(false);
  const { qualityChecks: checks, setQualityChecks: setChecks, orders } = useDataStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isStickerModalOpen, setIsStickerModalOpen] = useState(false);
  
  const passChecks = checks.filter((c: QualityCheck) => c.overallResult === 'Pass');
  const passRate = checks.length > 0 ? ((passChecks.length / checks.length) * 100).toFixed(1) + '%' : 'N/A';
  
  const recentFailures = checks.filter((c: QualityCheck) => c.overallResult === 'Fail').length;
  
  const sumAdhesion = checks.reduce((acc: number, curr: QualityCheck) => acc + curr.adhesionScore, 0);
  const avgAdhesion = checks.length > 0 ? (sumAdhesion / checks.length).toFixed(1) + '/10' : 'N/A';

  const [stickerData, setStickerData] = useState({
    company: 'metamorph' as 'metamorph' | 'ameyaa',
    customer: '',
    model: '',
    size: '',
    shade: '',
    pieces: '',
    bundles: '',
  });

  const generateStickerPrint = () => {
    setTimeout(() => {
       window.print();
    }, 200);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [newCheck, setNewCheck] = useState<Partial<QualityCheck>>({
    orderId: orders.length > 0 ? orders[0].id : '',
    adhesionScore: 10,
    thicknessMils: 2.0,
    cureStatus: 'Pass',
    visualDefects: [],
    overallResult: 'Pass',
    notes: '',
    photos: []
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newPhotos = Array.from(e.target.files).map(file => URL.createObjectURL(file as Blob));
      setNewCheck(prev => ({
        ...prev,
        photos: [...(prev.photos || []), ...newPhotos]
      }));
    }
  };

  const [defectInput, setDefectInput] = useState('');
  const [reportGeneratedId, setReportGeneratedId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const check: QualityCheck = {
      ...(newCheck as QualityCheck),
      id: `qa${Date.now()}`,
      date: new Date().toISOString(),
      inspectorId: 'u1'
    };
    setChecks(prev => [check, ...prev]);
    setReportGeneratedId(check.id);
    setIsAddingMode(false);
  };

  const defectTypes = ['Pinholing', 'Orange Peel', 'Blistering', 'Outgassing', 'Fish Eyes', 'Thin Coverage'];

  const filteredChecks = checks.filter(qa => {
    const order = orders.find(o => o.id === qa.orderId);
    const searchString = `${qa.id} ${order?.orderNumber} ${order?.customerName} ${qa.overallResult}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  if (reportGeneratedId) {
    const report = checks.find(c => c.id === reportGeneratedId);
    return (
      <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto px-4 py-8 sm:p-8">
        <button 
          onClick={() => setReportGeneratedId(null)}
          className="text-orange-500 text-[10px] font-bold uppercase tracking-widest flex items-center hover:text-zinc-900 dark:text-white"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to QA Dashboard
        </button>
        <div className="border border-black/5 dark:border-white/5 bg-[#f4f4f5] dark:bg-[#111] p-6 sm:p-8 rounded-2xl relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <ShieldAlert className="w-32 h-32" />
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-start mb-8 sm:mb-12 gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black uppercase text-zinc-900 dark:text-white tracking-widest leading-tight">Quality Control Report</h2>
              <p className="text-zinc-500 font-mono text-xs sm:text-sm mt-2">REF: {report?.id} // DATE: {new Date(report?.date || '').toLocaleDateString()}</p>
            </div>
            <div className={cn(
              "px-6 py-2 sm:py-3 border-2 rounded-xl text-lg sm:text-xl font-black uppercase tracking-widest self-start",
               report?.overallResult === 'Pass' ? "border-emerald-500 text-emerald-500" :
               report?.overallResult === 'Fail' ? "border-rose-500 text-rose-500" :
               "border-amber-500 text-amber-500"
            )}>
              {report?.overallResult}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 sm:gap-8 mb-8 sm:mb-12">
            <div className="bg-white dark:bg-black/50 p-4 rounded-xl border border-black/5 dark:border-white/5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 block">Order Ref</label>
              <div className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">{orders.find(o => o.id === report?.orderId)?.orderNumber}</div>
            </div>
            <div className="bg-white dark:bg-black/50 p-4 rounded-xl border border-black/5 dark:border-white/5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 block">Inspector</label>
              <div className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">Operator_u1</div>
            </div>
          </div>

          <div className="border border-black/5 dark:border-white/5 bg-white dark:bg-black/30 rounded-xl p-4 sm:p-8 mb-8 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
             <div>
               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Adhesion Score</label>
               <div className="text-2xl font-black text-zinc-900 dark:text-white">{report?.adhesionScore}/<span className="text-zinc-600">10</span></div>
             </div>
             <div className="hidden sm:block w-px h-full bg-black/5 dark:bg-white/5"></div>
             <div>
               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Thickness</label>
               <div className="text-2xl font-black text-zinc-900 dark:text-white">{report?.thicknessMils} <span className="text-zinc-600 text-sm">MILS</span></div>
             </div>
             <div className="hidden sm:block w-px h-full bg-black/5 dark:bg-white/5"></div>
             <div>
               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Cure Status</label>
               <div className={cn("text-2xl font-black", report?.cureStatus === 'Pass' ? 'text-emerald-400' : 'text-rose-400')}>{report?.cureStatus}</div>
             </div>
          </div>

          {report?.visualDefects && report.visualDefects.length > 0 && (
            <div className="mb-8">
               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4 block">Visual Defects Identified</label>
               <div className="flex gap-2 flex-wrap">
                 {report.visualDefects.map(d => (
                   <span key={d} className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-3 py-1.5 rounded-lg font-bold text-xs uppercase tracking-wider">{d}</span>
                 ))}
               </div>
            </div>
          )}

          {report?.photos && report.photos.length > 0 && (
             <div className="mb-8">
               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4 block">Job Sheet & Evidence</label>
               <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                 {report.photos.map((src, i) => (
                   <img key={i} src={src} alt="Defect evidence" className="w-48 h-48 rounded-xl object-cover border border-black/5 dark:border-white/5 shadow-md flex-shrink-0" />
                 ))}
               </div>
             </div>
          )}

          <div className="bg-white dark:bg-black/50 p-4 sm:p-6 rounded-xl border border-black/5 dark:border-white/5">
             <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 block">Inspector Notes</label>
             <p className="text-zinc-700 dark:text-zinc-300 font-mono text-sm leading-relaxed max-w-2xl">{report?.notes || "No additional notes provided."}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-8 md:p-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <label className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-orange-500">Module</label>
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight mt-1 text-zinc-900 dark:text-white">Quality Assurance</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2 font-medium text-sm">Log and monitor coating adhesion, thickness, and cure metrics.</p>
        </div>
        {!isAddingMode ? (
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={() => {
                 const passNumber = checks.filter(c => c.overallResult === 'Pass').length;
                 const failNumber = checks.filter(c => c.overallResult === 'Fail').length;
                 const totalChecks = checks.length;
                 const avgA = checks.length > 0 ? (checks.reduce((acc, curr) => acc + curr.adhesionScore, 0) / checks.length).toFixed(1) : 'N/A';
                 const avgT = checks.length > 0 ? (checks.reduce((acc, curr) => acc + curr.thicknessMils, 0) / checks.length).toFixed(1) : 'N/A';
                 const period = new Date().toLocaleDateString();
                 
                 const body = `Quality & Production Performance Report - ${period}
                 
Total Checks: ${totalChecks}
Pass Rate: ${passRate} (${passNumber} passed)
Failures: ${failNumber}

Averages:
- Adhesion: ${avgA}/10
- Thickness: ${avgT} mils

Best Regards,
Quality Control Team`;

                 window.open(`mailto:?subject=Weekly Performance Report&body=${encodeURIComponent(body)}`);
              }}
              className="inline-flex items-center justify-center border border-black/10 dark:border-white/20 bg-white dark:bg-black px-4 py-3 md:py-4 rounded-xl text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-white hover:bg-white hover:text-black transition-colors shadow-lg active:scale-95"
            >
              <Mail className="h-5 w-5 md:mr-2" />
              <span className="hidden md:inline">Email Report</span>
            </button>
            <button 
              onClick={() => setIsStickerModalOpen(true)}
              className="inline-flex items-center justify-center border border-black/10 dark:border-white/20 bg-white dark:bg-black px-6 py-3 md:py-4 rounded-xl text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-white hover:bg-white hover:text-black transition-colors shadow-lg active:scale-95"
            >
              <Tag className="h-5 w-5 mr-2" />
              Generator
            </button>
            <button 
              onClick={() => setIsAddingMode(true)}
              className="inline-flex items-center justify-center bg-orange-500 px-6 py-3 md:py-4 rounded-xl text-sm font-black uppercase tracking-widest text-black hover:bg-orange-600 transition-colors shadow-lg active:scale-95"
            >
              <ClipboardSignature className="h-5 w-5 mr-2" />
              Log QA Check
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setIsAddingMode(false)}
            className="inline-flex items-center justify-center border border-black/10 dark:border-white/20 bg-white dark:bg-black px-6 py-3 md:py-4 rounded-xl text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-white hover:bg-white hover:text-black transition-colors active:scale-95"
          >
            Cancel
          </button>
        )}
      </div>

      {isAddingMode ? (
        <Card className="bg-[#f4f4f5] dark:bg-[#111] border-black/5 dark:border-white/5 rounded-2xl overflow-hidden shadow-2xl">
          <CardContent className="p-4 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-widest text-zinc-900 dark:text-white mb-6 sm:mb-8 border-b border-black/5 dark:border-white/10 pb-4">QA Checklist & Report Form</h2>
            <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Target Order</label>
                  <select 
                    value={newCheck.orderId}
                    onChange={(e) => setNewCheck({...newCheck, orderId: e.target.value})}
                    className="w-full p-4 bg-white dark:bg-black border border-black/5 dark:border-white/10 text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 appearance-none rounded-xl font-medium"
                    required
                  >
                    {orders.map(o => (
                      <option key={o.id} value={o.id}>{o.orderNumber} - {o.customerName}</option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Adhesion (1-10)</label>
                    <input 
                      type="number" min="1" max="10"
                      value={newCheck.adhesionScore}
                      onChange={(e) => setNewCheck({...newCheck, adhesionScore: Number(e.target.value)})}
                      className="w-full p-4 bg-white dark:bg-black border border-black/5 dark:border-white/10 text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 rounded-xl font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Thickness (Mils)</label>
                    <input 
                      type="number" step="0.1"
                      value={newCheck.thicknessMils}
                      onChange={(e) => setNewCheck({...newCheck, thicknessMils: Number(e.target.value)})}
                      className="w-full p-4 bg-white dark:bg-black border border-black/5 dark:border-white/10 text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 rounded-xl font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-black/5 dark:border-white/10 pt-6 sm:pt-8">
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Defect Classification</label>
                <div className="flex flex-wrap gap-2 sm:gap-3 mb-4">
                  {defectTypes.map(type => {
                    const isSelected = newCheck.visualDefects?.includes(type);
                    return (
                      <button
                        type="button"
                        key={type}
                        onClick={() => {
                          const defects = newCheck.visualDefects || [];
                          setNewCheck({
                            ...newCheck,
                            visualDefects: isSelected ? defects.filter(d => d !== type) : [...defects, type]
                          });
                        }}
                        className={cn(
                          "px-4 py-3 sm:py-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest border transition-colors rounded-xl",
                          isSelected ? "bg-rose-500/20 border-rose-500/50 text-rose-400" : "bg-white dark:bg-black border-black/5 dark:border-white/10 text-zinc-600 dark:text-zinc-400 hover:border-white/50"
                        )}
                      >
                        {type}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 border-t border-black/5 dark:border-white/10 pt-6 sm:pt-8">
                <div>
                   <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Job Sheet & Evidence</label>
                   <input 
                     type="file" 
                     className="hidden" 
                     ref={cameraInputRef} 
                     multiple 
                     accept="image/*" 
                     capture="environment"
                     onChange={handleFileChange}
                   />
                   <input 
                     type="file" 
                     className="hidden" 
                     ref={fileInputRef} 
                     multiple 
                     accept="image/*" 
                     onChange={handleFileChange}
                   />
                   <div 
                     className="border-2 border-dashed border-black/5 dark:border-white/10 bg-white dark:bg-black rounded-xl p-4 flex flex-col items-center justify-center text-center min-h-[8rem]"
                   >
                     {newCheck.photos && newCheck.photos.length > 0 ? (
                       <div className="flex flex-wrap gap-2 justify-center w-full">
                         {newCheck.photos.map((src, i) => (
                           <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-black/10">
                              <img src={src} className="w-full h-full object-cover" />
                              <button 
                                type="button"
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  setNewCheck({...newCheck, photos: newCheck.photos?.filter((_, index) => index !== i)});
                                }}
                                className="absolute top-1 right-1 bg-black/90 text-white rounded-full p-0.5"
                              >
                                <XCircle className="w-3 h-3"/>
                              </button>
                           </div>
                         ))}
                         <div className="flex gap-2 isolate">
                           <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); cameraInputRef.current?.click(); }} className="w-16 h-16 rounded-lg border border-dashed border-black/10 dark:border-white/10 flex items-center justify-center hover:border-orange-500 transition-colors">
                             <Camera className="w-5 h-5 text-zinc-400" />
                           </button>
                           <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); fileInputRef.current?.click(); }} className="w-16 h-16 rounded-lg border border-dashed border-black/10 dark:border-white/10 flex items-center justify-center hover:border-orange-500 transition-colors">
                             <Plus className="w-5 h-5 text-zinc-400" />
                           </button>
                         </div>
                       </div>
                     ) : (
                       <div className="flex gap-4 w-full isolate">
                         <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); cameraInputRef.current?.click(); }} className="flex-1 flex flex-col items-center justify-center py-4 bg-black/5 dark:bg-white/5 rounded-lg hover:border-orange-500 border border-transparent transition-colors active:scale-95">
                           <Camera className="h-6 w-6 text-zinc-500 mb-2" />
                           <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest mt-2">Take Photo</span>
                         </button>
                         <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); fileInputRef.current?.click(); }} className="flex-1 flex flex-col items-center justify-center py-4 bg-black/5 dark:bg-white/5 rounded-lg hover:border-orange-500 border border-transparent transition-colors active:scale-95">
                           <ImageIcon className="h-6 w-6 text-zinc-500 mb-2" />
                           <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest mt-2">Library</span>
                         </button>
                       </div>
                     )}
                   </div>
                </div>
                <div>
                   <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Notes</label>
                   <textarea 
                     value={newCheck.notes}
                     onChange={(e) => setNewCheck({...newCheck, notes: e.target.value})}
                     className="w-full p-4 bg-white dark:bg-black border border-black/5 dark:border-white/10 text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 h-32 resize-none rounded-xl font-medium placeholder:text-zinc-600"
                     placeholder="Enter detailed observation notes..."
                   />
                </div>
              </div>

              <div className="bg-white dark:bg-black p-4 sm:p-6 rounded-xl border border-black/5 dark:border-white/10 flex flex-col gap-6 mt-8">
                 <div>
                   <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Overall Result</label>
                   <div className="flex gap-2 sm:gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x">
                     {['Pass', 'Rework', 'Fail'].map(res => (
                       <button
                         key={res}
                         type="button"
                         onClick={() => setNewCheck({...newCheck, overallResult: res as any})}
                         className={cn(
                           "flex-1 min-w-[100px] snap-center px-4 py-4 sm:py-3 text-sm font-black uppercase tracking-widest border transition-colors rounded-xl shadow-lg active:scale-95",
                           newCheck.overallResult === res 
                             ? (res === 'Pass' ? 'bg-emerald-500 text-black border-emerald-500' : res === 'Fail' ? 'bg-rose-500 text-black border-rose-500' : 'bg-amber-500 text-black border-amber-500')
                             : "bg-[#f4f4f5] dark:bg-[#111] border-black/5 dark:border-white/10 text-zinc-500"
                         )}
                       >
                         {res}
                       </button>
                     ))}
                   </div>
                 </div>
                 <button type="submit" className="w-full bg-orange-500 text-black px-8 py-4 font-black uppercase tracking-widest hover:bg-orange-600 transition-colors rounded-xl shadow-lg active:scale-[0.98]">
                   Generate Report
                 </button>
              </div>

            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center bg-[#f4f4f5] dark:bg-[#111] border border-black/5 dark:border-white/10 rounded-xl px-4 py-1 max-w-xl">
            <Search className="h-5 w-5 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search by ID, Order Ref, Customer, or Result..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent text-zinc-900 dark:text-white focus:outline-none p-3 font-medium placeholder:text-zinc-600"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <Card className="bg-emerald-500/10 border-emerald-500/20 rounded-2xl">
               <CardContent className="p-6">
                 <div className="flex items-center gap-4">
                   <div className="bg-emerald-500/20 p-3 text-emerald-400 rounded-xl">
                     <CheckCircle className="h-6 w-6" />
                   </div>
                   <div>
                     <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">First-Time Pass Rate</div>
                     <div className="text-4xl font-black uppercase tracking-tight text-zinc-900 dark:text-white mt-1">{passRate}</div>
                   </div>
                 </div>
               </CardContent>
             </Card>
             <Card className="bg-rose-500/10 border-rose-500/20 rounded-2xl">
               <CardContent className="p-6">
                 <div className="flex items-center gap-4">
                   <div className="bg-rose-500/20 p-3 text-rose-400 rounded-xl">
                     <XCircle className="h-6 w-6" />
                   </div>
                   <div>
                     <div className="text-[10px] font-bold uppercase tracking-widest text-rose-500">Recent Failures</div>
                     <div className="text-4xl font-black uppercase tracking-tight text-zinc-900 dark:text-white mt-1">{recentFailures}</div>
                   </div>
                 </div>
               </CardContent>
             </Card>
             <Card className="bg-orange-500/10 border-orange-500/20 rounded-2xl">
               <CardContent className="p-6">
                 <div className="flex items-center gap-4">
                   <div className="bg-orange-500/20 p-3 text-orange-400 rounded-xl">
                     <ShieldAlert className="h-6 w-6" />
                   </div>
                   <div>
                     <div className="text-[10px] font-bold uppercase tracking-widest text-orange-500">Avg Adhesion Score</div>
                     <div className="text-4xl font-black uppercase tracking-tight text-zinc-900 dark:text-white mt-1">{avgAdhesion}</div>
                   </div>
                 </div>
               </CardContent>
             </Card>
           </div>
     
           {/* Mobile view */}
           <div className="md:hidden space-y-4">
             {filteredChecks.map((qa) => {
               const order = orders.find(o => o.id === qa.orderId);
               return (
                 <div key={qa.id} className="bg-[#f4f4f5] dark:bg-[#111] border border-black/5 dark:border-white/5 rounded-2xl p-4 flex flex-col gap-4">
                   <div className="flex justify-between items-start">
                     <div>
                       <div className="font-bold text-orange-500 text-sm mb-1">{order?.orderNumber || qa.orderId}</div>
                       <div className="font-bold text-zinc-900 dark:text-white text-xs uppercase">{qa.id}</div> 
                       <div className="text-zinc-500 text-[10px] font-mono mt-0.5">{new Date(qa.date).toLocaleString()}</div>
                     </div>
                     <span className={cn(
                       "inline-flex items-center px-2 py-1 rounded-[6px] text-[10px] font-black uppercase tracking-widest border",
                       qa.overallResult === 'Pass' && "bg-emerald-500/20 text-emerald-400 border-emerald-500/50",
                       qa.overallResult === 'Fail' && "bg-rose-500/20 text-rose-400 border-rose-500/50",
                       qa.overallResult === 'Rework' && "bg-amber-500/20 text-amber-400 border-amber-500/50"
                     )}>
                       {qa.overallResult}
                     </span>
                   </div>

                   <div className="bg-white dark:bg-black/50 p-3 rounded-xl border border-black/5 dark:border-white/5 grid grid-cols-2 gap-4">
                     <div>
                       <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Adhesion</div>
                       <div className="font-mono text-zinc-900 dark:text-white text-sm">{qa.adhesionScore}<span className="text-zinc-600 text-[10px] ml-1">/10</span></div>
                     </div>
                     <div>
                       <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Thickness</div>
                       <div className="font-mono text-zinc-900 dark:text-white text-sm">{qa.thicknessMils} <span className="text-zinc-600 text-[10px] ml-1">MILS</span></div>
                     </div>
                   </div>

                   {qa.visualDefects.length > 0 && (
                     <div className="flex flex-wrap gap-1 border-t border-black/5 dark:border-white/5 pt-3">
                       {qa.visualDefects.map((defect, i) => (
                         <span key={i} className="px-2 py-1 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[9px] font-bold uppercase tracking-widest">
                           {defect}
                         </span>
                       ))}
                     </div>
                   )}

                   <button 
                     onClick={() => setReportGeneratedId(qa.id)}
                     className="w-full text-[11px] font-black uppercase tracking-widest text-black bg-white py-3 rounded-xl hover:bg-zinc-200 transition-colors mt-2 active:scale-95 shadow-lg"
                   >
                     View Full Report
                   </button>
                 </div>
               )
             })}
           </div>

           {/* Desktop view */}
           <Card className="hidden md:block bg-[#f4f4f5] dark:bg-[#111] border-black/5 dark:border-white/5 rounded-2xl overflow-hidden shadow-xl">
             <div className="overflow-x-auto w-full">
               <table className="w-full text-left font-sans whitespace-nowrap min-w-[800px]">
                 <thead className="bg-[#f4f4f5] dark:bg-[#111] text-zinc-500 text-[10px] font-black uppercase tracking-widest border-b border-black/10 dark:border-white/20">
                   <tr>
                     <th className="px-6 py-4">Check ID / Date</th>
                     <th className="px-6 py-4">Order Ref</th>
                     <th className="px-6 py-4">Metrics</th>
                     <th className="px-6 py-4 hidden lg:table-cell">Defects</th>
                     <th className="px-6 py-4">Result</th>
                     <th className="px-6 py-4 text-right">Details</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-white/10 text-zinc-900 dark:text-white">
                   {filteredChecks.map((qa) => {
                     const order = orders.find(o => o.id === qa.orderId);
                     
                     return (
                       <tr key={qa.id} className="hover:bg-black/5 dark:bg-white/5 transition-colors group">
                         <td className="px-6 py-5">
                           <div className="font-bold text-sm uppercase text-zinc-900 dark:text-white">{qa.id}</div>
                           <div className="text-zinc-500 text-xs mt-1 font-mono">
                             {new Date(qa.date).toLocaleString()}
                           </div>
                         </td>
                         <td className="px-6 py-5">
                           <div className="font-bold text-orange-500 text-sm">{order?.orderNumber || qa.orderId}</div>
                         </td>
                         <td className="px-6 py-5">
                           <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                             <span className="text-zinc-500 font-bold uppercase">Adhesion:</span>
                             <span className="font-mono text-zinc-900 dark:text-white">{qa.adhesionScore}/10</span>
                             <span className="text-zinc-500 font-bold uppercase">Thickness:</span>
                             <span className="font-mono text-zinc-900 dark:text-white">{qa.thicknessMils} Mils</span>
                           </div>
                         </td>
                         <td className="px-6 py-5 hidden lg:table-cell">
                           {qa.visualDefects.length > 0 ? (
                             <div className="flex flex-wrap gap-1">
                               {qa.visualDefects.map((defect, i) => (
                                 <span key={i} className="px-2 py-0.5 border border-rose-500/50 text-rose-400 text-[10px] font-bold uppercase tracking-widest">
                                   {defect}
                                 </span>
                               ))}
                             </div>
                           ) : (
                             <span className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">None</span>
                           )}
                         </td>
                         <td className="px-6 py-5">
                           <span className={cn(
                             "inline-flex items-center px-2 py-1 text-[10px] font-black uppercase tracking-widest border",
                             qa.overallResult === 'Pass' && "bg-emerald-500/20 text-emerald-400 border-emerald-500/50",
                             qa.overallResult === 'Fail' && "bg-rose-500/20 text-rose-400 border-rose-500/50",
                             qa.overallResult === 'Rework' && "bg-amber-500/20 text-amber-400 border-amber-500/50"
                           )}>
                             {qa.overallResult}
                           </span>
                         </td>
                         <td className="px-6 py-5 text-right">
                           <button 
                              onClick={() => setReportGeneratedId(qa.id)}
                              className="text-[10px] font-bold text-zinc-900 dark:text-white border border-black/10 dark:border-white/20 px-3 py-1 uppercase hover:bg-white hover:text-black transition-colors"
                            >
                             View Report
                           </button>
                         </td>
                       </tr>
                     )
                   })}
                 </tbody>
               </table>
             </div>
           </Card>
        </div>
      )}

      <Modal isOpen={isStickerModalOpen} onClose={() => setIsStickerModalOpen(false)} title="Generate Packing Sticker">
        <div className="space-y-4 print:hidden">
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Brand / Company</label>
            <div className="flex gap-2">
              <button
                onClick={() => setStickerData({...stickerData, company: 'metamorph'})}
                className={cn("flex-1 py-3 px-4 rounded-xl border text-sm font-bold uppercase tracking-widest transition-colors", stickerData.company === 'metamorph' ? "bg-orange-500 border-orange-500 text-white" : "border-black/10 dark:border-white/10 dark:text-white")}
              >
                Metamorph
              </button>
              <button
                onClick={() => setStickerData({...stickerData, company: 'ameyaa'})}
                className={cn("flex-1 py-3 px-4 rounded-xl border text-sm font-bold uppercase tracking-widest transition-colors", stickerData.company === 'ameyaa' ? "bg-[#2e3192] border-[#2e3192] text-white" : "border-black/10 dark:border-white/10 dark:text-white")}
              >
                Ameyaa
              </button>
            </div>
          </div>
          {stickerData.company === 'metamorph' && (
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Target Order (Optional)</label>
              <select 
                onChange={(e) => {
                  const o = orders.find(order => order.id === e.target.value);
                  if (o) setStickerData({...stickerData, customer: o.customerName});
                }}
                className="w-full px-4 py-4 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-black text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors appearance-none font-medium mb-4"
              >
                <option value="">Select an order to autofill customer...</option>
                {orders.map(o => (
                  <option key={o.id} value={o.id}>{o.orderNumber} - {o.customerName}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Owner (Customer)</label>
            <input 
              type="text" 
              value={stickerData.customer}
              onChange={e => setStickerData({...stickerData, customer: e.target.value})}
              className="w-full px-4 py-4 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-black text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-medium placeholder:text-zinc-600"
              placeholder="e.g. Telesia"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Model (Material)</label>
              <input 
                type="text" 
                value={stickerData.model}
                onChange={e => setStickerData({...stickerData, model: e.target.value})}
                className="w-full px-4 py-4 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-black text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-medium placeholder:text-zinc-600"
                placeholder="e.g. D Frame"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Size</label>
              <input 
                type="text" 
                value={stickerData.size}
                onChange={e => setStickerData({...stickerData, size: e.target.value})}
                className="w-full px-4 py-4 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-black text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-medium placeholder:text-zinc-600"
                placeholder="e.g. 4800"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Shade</label>
              <input 
                type="text" 
                value={stickerData.shade}
                onChange={e => setStickerData({...stickerData, shade: e.target.value})}
                className="w-full px-4 py-4 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-black text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-medium placeholder:text-zinc-600"
                placeholder="e.g. 8040"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Pieces / Bundle</label>
              <input 
                type="number" 
                value={stickerData.pieces}
                onChange={e => setStickerData({...stickerData, pieces: e.target.value})}
                className="w-full px-4 py-4 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-black text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-medium placeholder:text-zinc-600"
                placeholder="6"
              />
            </div>
            <div className="col-span-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Total Bundles</label>
              <input 
                type="number" 
                value={stickerData.bundles}
                onChange={e => setStickerData({...stickerData, bundles: e.target.value})}
                className="w-full px-4 py-4 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-black text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-medium placeholder:text-zinc-600"
                placeholder="24"
              />
            </div>
          </div>
          <button 
            onClick={generateStickerPrint}
            className="w-full inline-flex items-center justify-center bg-orange-500 text-black font-black uppercase tracking-widest py-4 rounded-xl mt-4 hover:bg-orange-600 transition-colors shadow-lg active:scale-[0.98]"
          >
            <Printer className="w-5 h-5 mr-3" />
            Print Stickers
          </button>
        </div>
      </Modal>

      {/* Hidden Print Layout */}
      {typeof document !== 'undefined' && createPortal(
        <div className="hidden print:block print-container">
          {Array.from({ length: Math.ceil((parseInt(stickerData.bundles) || 1) / 16) }).map((_, pageIndex) => (
            <div key={pageIndex} className="page-table-wrapper">
               <table className="page-table">
                 <tbody>
                   {Array.from({ length: 4 }).map((_, row) => (
                     <tr key={row}>
                       {Array.from({ length: 4 }).map((_, col) => {
                          const bundleNo = pageIndex * 16 + row * 4 + col + 1;
                          if (bundleNo <= (parseInt(stickerData.bundles) || 1)) {
                            return (
                              <td key={col} className="sticker-cell">
                                <div className="sticker-inner" style={{ color: stickerData.company === 'ameyaa' ? '#2e3192' : '#003E73' }}>
                                  {stickerData.company === 'metamorph' ? (
                                    <>
                                      <div className="logo-group">
                                        <img src="/logo.png" alt="Logo" className="logo-mark" />
                                        <img src="/wordmark.png" alt="METAMORPH" className="wordmark-img max-w-[70%] object-contain" />
                                      </div>
                                      <div className="divider" style={{ background: '#EC6C1E' }} />
                                    </>
                                  ) : (
                                    <>
                                      <div className="logo-group">
                                        <img src="/ameyaa_logo.png" alt="Ameyaa Logo" className="logo-mark" />
                                        <img src="/ameyaa_wordmark.png" alt="Ameyaa Engitech" className="wordmark-img max-w-[70%] object-contain" />
                                      </div>
                                      <div className="divider" style={{ background: '#FF5C00' }} />
                                    </>
                                  )}
                                  <div className="lbl" style={{ top: '25%' }}>Owner<span style={{ display: 'inline-block', marginLeft: '20px' }}>:</span></div>
                                  <div className="val" style={{ top: '25%' }}>{stickerData.customer || ''}</div>
                                  
                                  <div className="lbl" style={{ top: '36%' }}>Section No<span style={{ display: 'inline-block', marginLeft: '3px' }}>:</span></div>
                                  <div className="val" style={{ top: '36%' }}>{stickerData.model || ''}</div>
                                  
                                  <div className="lbl" style={{ top: '47%' }}>Size<span style={{ display: 'inline-block', marginLeft: '27px' }}>:</span></div>
                                  <div className="val" style={{ top: '47%' }}>{stickerData.size || ''}</div>
                                  
                                  <div className="lbl" style={{ top: '58%' }}>Shade<span style={{ display: 'inline-block', marginLeft: '17px' }}>:</span></div>
                                  <div className="val" style={{ top: '58%' }}>{stickerData.shade || ''}</div>
                                  
                                  <div className="lbl" style={{ top: '69%' }}>Pcs<span style={{ display: 'inline-block', marginLeft: '29.5px' }}>:</span></div>
                                  <div className="val" style={{ top: '69%' }}>{stickerData.pieces || ''}</div>
                                  
                                  <div className="lbl" style={{ top: '80%' }}>Bundle No<span style={{ display: 'inline-block', marginLeft: '7px' }}>:</span></div>
                                  <div className="val" style={{ top: '80%' }}>{bundleNo}/{parseInt(stickerData.bundles) || 1}</div>
                                </div>
                              </td>
                            );
                          }
                          return <td key={col} className="empty-cell" />;
                       })}
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
