import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Card, CardContent } from '../components/ui/Card';
import { useDataStore } from '../store/data';
import { ShieldAlert, CheckCircle, XCircle, Search, ClipboardSignature, ArrowLeft, Image as ImageIcon, Printer, Tag, Plus, Camera, Mail, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { QualityCheck, Order } from '../types';
import Modal from '../components/ui/Modal';
import { toast } from 'sonner';
import { downloadPdf } from '../lib/pdf';
import { motion } from 'motion/react';

export default function Quality() {
  const [isAddingMode, setIsAddingMode] = useState(false);
  const { qualityChecks: checks, setQualityChecks: setChecks, orders, inventory, addActivityLog, setInventoryUsages, setInventory } = useDataStore();
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
    photos: [],
    powderUsages: []
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
    
    // Log powder usages and reduce inventory
    if (check.powderUsages && check.powderUsages.length > 0) {
      const order = orders.find(o => o.id === check.orderId);
      check.powderUsages.forEach(usage => {
         const newUsage = {
            id: Math.random().toString(36).substring(2, 9),
            inventoryId: usage.inventoryId,
            orderId: order?.orderNumber || check.orderId,
            customerName: order?.customerName,
            amountKg: usage.amountKg,
            date: new Date().toISOString()
         };
         setInventoryUsages(prev => [...prev, newUsage]);
         
         const powderItem = inventory.find(i => i.id === usage.inventoryId);
         if (powderItem) {
           setInventory(prev => prev.map(i => i.id === usage.inventoryId ? { ...i, weightKg: Math.max(0, i.weightKg - usage.amountKg) } : i));
           addActivityLog({ action: 'process', module: 'Inventory', details: `${usage.amountKg}kg of ${powderItem.name} used via QA on order ${order?.orderNumber || 'Unknown'}`, userId: 'u1', userName: 'QA Inspector' });
         }
      });
    }

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
    const order = orders.find(o => o.id === report?.orderId);
    const dateStr = new Date(report?.date || '').toLocaleDateString('en-IN').replace(/\//g, '-');
    const usedShades = report?.powderUsages?.map(u => u.name || inventory.find(i => i.id === u.inventoryId)?.name).join(', ') || 'RAL9017'; // fallback to standard

    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-5xl mx-auto px-4 py-8 bg-white text-black font-sans min-h-screen print:p-0 print:m-0"
      >
        <div className="flex justify-between items-center mb-6 print:hidden">
          <button 
            onClick={() => setReportGeneratedId(null)}
            className="text-orange-500 text-sm font-semibold flex items-center hover:text-orange-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to QA Dashboard
          </button>
          <button 
            onClick={() => window.print()}
            className="text-orange-500 text-sm font-semibold flex items-center hover:text-orange-600 transition-colors bg-orange-50 px-4 py-2 rounded-lg border border-orange-200 active:scale-95"
          >
            <Printer className="h-4 w-4 mr-2" /> Print Report
          </button>
        </div>

        {/* Minimalist QA Report Format */}
        <div className="w-full bg-[#f8f7f5] text-zinc-900 font-sans p-12 md:p-16 max-w-4xl mx-auto shadow-sm print:shadow-none print:p-8 print:w-full">
           <div className="flex justify-between items-start mb-16">
              <div className="flex flex-col gap-6">
                 <img src="/logo.png" alt="Metamorph Logo" className="h-14 w-auto object-contain object-left filter invert brightness-0" style={{ filter: 'invert(52%) sepia(85%) saturate(2410%) hue-rotate(345deg) brightness(101%) contrast(97%)' }} />
                 
                 <div className="text-sm space-y-1 text-zinc-600">
                    <p className="font-semibold text-zinc-900 text-lg mb-2">METAMORPH METAL PROTECT LLP</p>
                    <p>Customer: <span className="font-medium text-zinc-900">{order?.customerName || 'N/A'}</span></p>
                    <p>Order Ref: <span className="font-medium text-zinc-900">{order?.orderNumber || 'N/A'}</span></p>
                    <p>Shade: <span className="font-medium text-zinc-900">{usedShades}</span></p>
                 </div>
              </div>
              <div className="text-right flex flex-col items-end gap-6">
                 <h1 className="text-5xl font-light tracking-tight text-zinc-900 uppercase">QA Report</h1>
                 <p className="text-lg font-medium text-orange-600">#{report?.id?.replace('qa', '') || '045'}</p>
              </div>
           </div>

           <div className="mb-12">
             <h2 className="text-2xl font-medium mb-6 text-zinc-900">Inspection Details</h2>
             <div className="h-px w-full bg-zinc-300 mb-6" />
             
             <div className="space-y-4 text-sm">
                <div className="flex justify-between items-center py-2 border-b border-zinc-200/60">
                   <span className="text-zinc-600">Quantity Inspected</span>
                   <span className="font-medium text-zinc-900">{order?.items || 0} PCS</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-zinc-200/60">
                   <span className="text-zinc-600">Quantity Accepted</span>
                   <span className="font-medium text-zinc-900">{report?.overallResult === 'Pass' ? (order?.items || 0) : '0'} PCS</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-zinc-200/60">
                   <span className="text-zinc-600">Quantity Rejected</span>
                   <span className="font-medium text-zinc-900">{report?.overallResult === 'Fail' ? (order?.items || 0) : '0'} PCS</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-zinc-200/60">
                   <span className="text-zinc-600">Thickness (Micron)</span>
                   <span className="font-medium text-zinc-900">{(report?.thicknessMils || 2.0) * 25.4} - {((report?.thicknessMils || 2.0) * 25.4) + 30}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-zinc-200/60">
                   <span className="text-zinc-600">Adhesion Score</span>
                   <span className="font-medium text-zinc-900">{report?.adhesionScore}/10</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-zinc-200/60">
                   <span className="text-zinc-600">Curing Status</span>
                   <span className="font-medium text-zinc-900">{report?.cureStatus}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-zinc-200/60">
                   <span className="text-zinc-600">Visual Defects</span>
                   <span className="font-medium text-zinc-900">{report?.visualDefects?.length ? report.visualDefects.join(', ') : 'None'}</span>
                </div>
             </div>
           </div>

           <div className="flex justify-end mb-16">
              <div className="w-64 space-y-4 text-sm">
                 <div className="flex justify-between items-center">
                    <span className="text-zinc-600">Date</span>
                    <span className="font-medium text-zinc-900">{dateStr}</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-zinc-600">Inspector</span>
                    <span className="font-medium text-zinc-900">QA Dept</span>
                 </div>
                 <div className="h-px w-full bg-zinc-300 my-2" />
                 <div className="flex justify-between items-center text-base">
                    <span className="font-medium text-zinc-900">Overall Status</span>
                    <span className={cn("font-semibold", report?.overallResult === 'Pass' ? 'text-emerald-600' : report?.overallResult === 'Fail' ? 'text-rose-600' : 'text-orange-600')}>{report?.overallResult}</span>
                 </div>
              </div>
           </div>

           <div className="h-px w-full bg-zinc-300 mb-8" />
           
           <div className="flex justify-between gap-12 text-sm text-zinc-600">
              <div className="flex-1">
                 <h3 className="text-base font-medium text-zinc-900 mb-4">Remarks</h3>
                 <p>{report?.notes || 'All quality checks passed according to standard specifications.'}</p>
                 {report?.overallResult === 'Rework' && <p className="mt-2 text-orange-600 font-medium">Requires immediate attention for rework.</p>}
              </div>
              <div className="flex-1">
                 <h3 className="text-base font-medium text-zinc-900 mb-4">Terms & Conditions</h3>
                 <p className="mb-8">Job is certified as per the parameters inspected. Special care to be taken during transportation to avoid damage.</p>
                 <div className="pt-8 border-t border-zinc-300 w-48">
                    <p className="text-center font-medium">Authorized Signature</p>
                 </div>
              </div>
           </div>
        </div>

      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-7xl mx-auto px-4 py-8 md:p-8"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <label className="text-xs md:text-xs font-semibold text-orange-500">Module</label>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mt-1 text-zinc-900 dark:text-white">Quality Assurance</h1>
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
              className="inline-flex items-center justify-center border border-black/10 dark:border-white/20 bg-white/40 dark:bg-black/20 backdrop-blur-md px-4 py-3 md:py-4 rounded-xl text-xs font-semibold text-zinc-900 dark:text-white hover:bg-white hover:text-black hover:border-black/20 transition-all shadow-lg active:scale-95"
            >
              <Mail className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Email Report</span>
            </button>
            <button 
              onClick={() => setIsStickerModalOpen(true)}
              className="inline-flex items-center justify-center border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-5 py-2.5 rounded-lg text-sm font-medium text-zinc-900 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm active:scale-95"
            >
              <Tag className="h-4 w-4 mr-2" />
              Generator
            </button>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsAddingMode(true)}
              className="inline-flex items-center justify-center bg-orange-600 px-5 py-2.5 rounded-lg text-sm font-medium text-white hover:bg-orange-700 transition-colors shadow-sm"
            >
              <ClipboardSignature className="h-4 w-4 mr-2" />
              Log QA Check
            </motion.button>
          </div>
        ) : (
          <button 
            onClick={() => setIsAddingMode(false)}
            className="inline-flex items-center justify-center border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-5 py-2.5 rounded-lg text-sm font-medium text-zinc-900 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm active:scale-95"
          >
            Cancel
          </button>
        )}
      </div>

      {isAddingMode ? (
        <Card className="bg-white/40 dark:bg-black/20 backdrop-blur-xl border-black/5 dark:border-white/5 rounded-[24px] overflow-hidden shadow-2xl">
          <CardContent className="p-5 sm:p-10">
            <h2 className="text-xl sm:text-2xl font-semibold text-zinc-900 dark:text-white mb-6 sm:mb-10 border-b border-black/5 dark:border-white/10 pb-6 flex items-center gap-3">
               <ShieldAlert className="w-6 h-6 text-orange-500" />
               QA Checklist & Report
            </h2>
            <form onSubmit={handleSubmit} className="space-y-8 sm:space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 mb-3">Target Order</label>
                  <select 
                    value={newCheck.orderId}
                    onChange={(e) => setNewCheck({...newCheck, orderId: e.target.value})}
                    className="w-full p-4 bg-white/60 dark:bg-black/40 border border-black/10 dark:border-white/10 text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 appearance-none rounded-xl font-medium backdrop-blur-md transition-colors"
                    required
                  >
                    {orders.map(o => (
                      <option key={o.id} value={o.id}>{o.orderNumber} - {o.customerName}</option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 mb-3">Adhesion (1-10)</label>
                    <input 
                      type="number" min="1" max="10"
                      value={newCheck.adhesionScore}
                      onChange={(e) => setNewCheck({...newCheck, adhesionScore: Number(e.target.value)})}
                      className="w-full p-4 bg-white/60 dark:bg-black/40 border border-black/10 dark:border-white/10 text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 rounded-xl font-medium backdrop-blur-md transition-colors text-center text-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 mb-3">Thickness (Mils)</label>
                    <input 
                      type="number" step="0.1"
                      value={newCheck.thicknessMils}
                      onChange={(e) => setNewCheck({...newCheck, thicknessMils: Number(e.target.value)})}
                      className="w-full p-4 bg-white/60 dark:bg-black/40 border border-black/10 dark:border-white/10 text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 rounded-xl font-medium backdrop-blur-md transition-colors text-center text-xl"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-black/5 dark:border-white/10 pt-8 sm:pt-10">
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-xs font-semibold text-zinc-500">Powder Usage Log (Optional)</label>
                  <button type="button" onClick={() => setNewCheck({...newCheck, powderUsages: [...(newCheck.powderUsages || []), {inventoryId: '', amountKg: 0}]})} className="text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors bg-orange-500/10 px-3 py-1.5 rounded-lg border border-orange-500/20 active:scale-95">+ Add Powder</button>
                </div>
                
                <div className="space-y-4">
                  {(newCheck.powderUsages || []).map((usage, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-white/40 dark:bg-black/20 p-4 rounded-xl border border-black/5 dark:border-white/5 backdrop-blur-md">
                      <select 
                        value={usage.inventoryId}
                        onChange={(e) => {
                          const newUsages = [...(newCheck.powderUsages || [])];
                          newUsages[idx].inventoryId = e.target.value;
                          setNewCheck({...newCheck, powderUsages: newUsages});
                        }}
                        className="flex-1 w-full sm:w-auto p-3 bg-white/60 dark:bg-black/40 border border-black/10 dark:border-white/10 text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 rounded-lg text-sm font-medium appearance-none"
                      >
                        <option value="">Select powder...</option>
                        {inventory.map(item => (
                          <option key={item.id} value={item.id}>{item.name} ({item.weightKg}kg in stock)</option>
                        ))}
                      </select>
                      
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <input
                          type="number"
                          step="0.1" min="0.1"
                          placeholder="Amount (kg)"
                          value={usage.amountKg || ''}
                          onChange={(e) => {
                            const newUsages = [...(newCheck.powderUsages || [])];
                            newUsages[idx].amountKg = Number(e.target.value);
                            setNewCheck({...newCheck, powderUsages: newUsages});
                          }}
                          className="w-full sm:w-32 p-3 bg-white/60 dark:bg-black/40 border border-black/10 dark:border-white/10 text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 rounded-lg text-sm font-medium"
                        />
                        <button type="button" onClick={() => {
                          const newUsages = [...(newCheck.powderUsages || [])];
                          newUsages.splice(idx, 1);
                          setNewCheck({...newCheck, powderUsages: newUsages});
                        }} className="p-3 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-colors border border-rose-500/20 active:scale-95">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {(!newCheck.powderUsages || newCheck.powderUsages.length === 0) && (
                    <div className="text-sm text-zinc-500 font-medium p-4 bg-black/5 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5 border-dashed text-center">
                      No powder logged for this check.
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-black/5 dark:border-white/10 pt-8 sm:pt-10">
                <label className="block text-xs font-semibold text-zinc-500 mb-4">Defect Classification</label>
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
                          "px-5 py-3 sm:py-2.5 text-xs font-semibold border transition-all rounded-lg backdrop-blur-md",
                          isSelected ? "bg-rose-500/20 border-rose-500/50 text-rose-600 dark:text-rose-400" : "bg-white/40 dark:bg-black/20 border-black/10 dark:border-white/10 text-zinc-600 dark:text-zinc-400 hover:border-black/30 dark:hover:border-white/30"
                        )}
                      >
                        {type}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10 border-t border-black/5 dark:border-white/10 pt-8 sm:pt-10">
                <div>
                   <label className="block text-xs font-semibold text-zinc-500 mb-4">Job Sheet & Evidence</label>
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
                     className="border-2 border-dashed border-black/10 dark:border-white/20 bg-white/20 dark:bg-black/20 backdrop-blur-md rounded-[20px] p-6 flex flex-col items-center justify-center text-center min-h-[12rem] hover:border-orange-500/50 transition-colors"
                   >
                     {newCheck.photos && newCheck.photos.length > 0 ? (
                       <div className="flex flex-wrap gap-3 justify-center w-full">
                         {newCheck.photos.map((src, i) => (
                           <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-black/10 shadow-lg group">
                              <img src={src} className="w-full h-full object-cover" />
                              <button 
                                type="button"
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  setNewCheck({...newCheck, photos: newCheck.photos?.filter((_, index) => index !== i)});
                                }}
                                className="absolute inset-0 bg-black/60 text-white p-0.5 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm"
                              >
                                <XCircle className="w-6 h-6 text-rose-500"/>
                              </button>
                           </div>
                         ))}
                         <div className="flex gap-3 isolate">
                           <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); cameraInputRef.current?.click(); }} className="w-20 h-20 rounded-xl border-2 border-dashed border-black/10 dark:border-white/20 flex items-center justify-center hover:border-orange-500 bg-white/40 dark:bg-black/40 backdrop-blur-md transition-colors group">
                             <Camera className="w-6 h-6 text-zinc-400 group-hover:text-orange-500 transition-colors" />
                           </button>
                           <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); fileInputRef.current?.click(); }} className="w-20 h-20 rounded-xl border-2 border-dashed border-black/10 dark:border-white/20 flex items-center justify-center hover:border-orange-500 bg-white/40 dark:bg-black/40 backdrop-blur-md transition-colors group">
                             <Plus className="w-6 h-6 text-zinc-400 group-hover:text-orange-500 transition-colors" />
                           </button>
                         </div>
                       </div>
                     ) : (
                       <div className="flex gap-4 w-full isolate">
                         <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); cameraInputRef.current?.click(); }} className="flex-1 flex flex-col items-center justify-center py-6 bg-white/60 dark:bg-black/40 backdrop-blur-md rounded-xl hover:border-orange-500 border border-transparent transition-all active:scale-95 shadow-sm">
                           <Camera className="h-8 w-8 text-zinc-400 mb-3" />
                           <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mt-2">Take Photo</span>
                         </button>
                         <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); fileInputRef.current?.click(); }} className="flex-1 flex flex-col items-center justify-center py-6 bg-white/60 dark:bg-black/40 backdrop-blur-md rounded-xl hover:border-orange-500 border border-transparent transition-all active:scale-95 shadow-sm">
                           <ImageIcon className="h-8 w-8 text-zinc-400 mb-3" />
                           <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mt-2">Library</span>
                         </button>
                       </div>
                     )}
                   </div>
                </div>
                <div>
                   <label className="block text-xs font-semibold text-zinc-500 mb-4">Notes</label>
                   <textarea 
                     value={newCheck.notes}
                     onChange={(e) => setNewCheck({...newCheck, notes: e.target.value})}
                     className="w-full p-5 bg-white/60 dark:bg-black/40 border border-black/10 dark:border-white/10 text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 h-[12rem] resize-none rounded-[20px] font-medium placeholder:text-zinc-500 backdrop-blur-md transition-colors"
                     placeholder="Enter detailed observation notes..."
                   />
                </div>
              </div>

              <div className="bg-white/40 dark:bg-black/20 backdrop-blur-xl p-5 sm:p-8 rounded-[24px] border border-black/10 dark:border-white/10 flex flex-col gap-8 mt-10">
                 <div>
                   <label className="block text-xs font-semibold text-zinc-500 mb-4 text-center">Overall Result</label>
                   <div className="flex gap-3 sm:gap-6 overflow-x-auto pb-2 scrollbar-hide snap-x justify-center">
                     {['Pass', 'Rework', 'Fail'].map(res => (
                       <button
                         key={res}
                         type="button"
                         onClick={() => setNewCheck({...newCheck, overallResult: res as any})}
                         className={cn(
                           "flex-1 min-w-[120px] max-w-[200px] snap-center px-4 py-5 text-xs font-semibold border-2 transition-all rounded-xl shadow-lg active:scale-95 backdrop-blur-md",
                           newCheck.overallResult === res 
                             ? (res === 'Pass' ? 'bg-emerald-500 text-black border-emerald-500' : res === 'Fail' ? 'bg-rose-500 text-black border-rose-500' : 'bg-amber-500 text-black border-amber-500')
                             : "bg-white/60 dark:bg-black/60 border-transparent text-zinc-500 hover:border-black/10 dark:hover:border-white/10"
                         )}
                       >
                         {res}
                       </button>
                     ))}
                   </div>
                 </div>
                 <motion.button 
                   whileHover={{ scale: 1.01 }}
                   whileTap={{ scale: 0.99 }}
                   type="submit" 
                   className="w-full bg-orange-500 text-white px-8 py-5 text-sm font-semibold hover:bg-orange-400 transition-colors rounded-xl shadow-[0_0_30px_rgba(249,115,22,0.3)]"
                 >
                   Generate Quality Report
                 </motion.button>
              </div>

            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          <div className="flex items-center bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-xl px-4 py-2 max-w-xl shadow-sm">
            <Search className="h-5 w-5 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search by ID, Order Ref, Customer..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent text-zinc-900 dark:text-white focus:outline-none p-3 font-medium placeholder:text-zinc-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
               <Card className="bg-emerald-500/10 border-emerald-500/20 rounded-[24px] backdrop-blur-xl overflow-hidden relative group">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-bl-full -mr-8 -mt-8 opacity-0 group-hover:opacity-100 transition-opacity blur-2xl"></div>
                 <CardContent className="p-6 relative z-10">
                   <div className="flex items-center gap-5">
                     <div className="bg-emerald-500/20 p-4 text-emerald-500 rounded-xl shadow-sm">
                       <CheckCircle className="h-7 w-7" />
                     </div>
                     <div>
                       <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">First-Time Pass Rate</div>
                       <div className="text-4xl font-semibold uppercase tracking-tight text-emerald-700 dark:text-emerald-300 mt-1">{passRate}</div>
                     </div>
                   </div>
                 </CardContent>
               </Card>
             </motion.div>
             <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
               <Card className="bg-rose-500/10 border-rose-500/20 rounded-[24px] backdrop-blur-xl overflow-hidden relative group">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/20 rounded-bl-full -mr-8 -mt-8 opacity-0 group-hover:opacity-100 transition-opacity blur-2xl"></div>
                 <CardContent className="p-6 relative z-10">
                   <div className="flex items-center gap-5">
                     <div className="bg-rose-500/20 p-4 text-rose-500 rounded-xl shadow-sm">
                       <XCircle className="h-7 w-7" />
                     </div>
                     <div>
                       <div className="text-xs font-semibold text-rose-600 dark:text-rose-400">Recent Failures</div>
                       <div className="text-4xl font-semibold uppercase tracking-tight text-rose-700 dark:text-rose-300 mt-1">{recentFailures}</div>
                     </div>
                   </div>
                 </CardContent>
               </Card>
             </motion.div>
             <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
               <Card className="bg-orange-500/10 border-orange-500/20 rounded-[24px] backdrop-blur-xl overflow-hidden relative group">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/20 rounded-bl-full -mr-8 -mt-8 opacity-0 group-hover:opacity-100 transition-opacity blur-2xl"></div>
                 <CardContent className="p-6 relative z-10">
                   <div className="flex items-center gap-5">
                     <div className="bg-orange-500/20 p-4 text-orange-500 rounded-xl shadow-sm">
                       <ShieldAlert className="h-7 w-7" />
                     </div>
                     <div>
                       <div className="text-xs font-semibold text-orange-600 dark:text-orange-400">Avg Adhesion Score</div>
                       <div className="text-4xl font-semibold uppercase tracking-tight text-orange-700 dark:text-orange-300 mt-1">{avgAdhesion}</div>
                     </div>
                   </div>
                 </CardContent>
               </Card>
             </motion.div>
            </div>
      
            {/* Mobile view */}
            <div className="md:hidden space-y-4">
              {filteredChecks.map((qa, idx) => {
                const order = orders.find(o => o.id === qa.orderId);
                return (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    key={qa.id} 
                    className="bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-[20px] p-5 flex flex-col gap-5 shadow-lg"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-orange-500 text-sm mb-1">{order?.orderNumber || qa.orderId}</div>
                        <div className="font-semibold text-zinc-900 dark:text-white text-sm">{qa.id}</div> 
                        <div className="text-zinc-500 text-xs mt-1">{new Date(qa.date).toLocaleString()}</div>
                      </div>
                      <span className={cn(
                        "inline-flex items-center px-3 py-1.5 rounded-md text-xs font-semibold border backdrop-blur-md",
                        qa.overallResult === 'Pass' && "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
                        qa.overallResult === 'Fail' && "bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30",
                        qa.overallResult === 'Rework' && "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30"
                      )}>
                        {qa.overallResult}
                      </span>
                    </div>

                    <div className="bg-white/60 dark:bg-black/40 p-4 rounded-xl border border-black/5 dark:border-white/5 grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs font-semibold text-zinc-500 mb-1">Adhesion</div>
                        <div className="font-semibold text-zinc-900 dark:text-white text-lg">{qa.adhesionScore}<span className="text-zinc-400 text-xs ml-1">/10</span></div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-zinc-500 mb-1">Thickness</div>
                        <div className="font-semibold text-zinc-900 dark:text-white text-lg">{qa.thicknessMils} <span className="text-zinc-400 text-xs ml-1 uppercase">Mils</span></div>
                      </div>
                    </div>

                    {qa.visualDefects.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 border-t border-black/5 dark:border-white/5 pt-4">
                        {qa.visualDefects.map((defect, i) => (
                          <span key={i} className="px-2.5 py-1 rounded-[6px] bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold backdrop-blur-md">
                            {defect}
                          </span>
                        ))}
                      </div>
                    )}

                    <button 
                      onClick={() => setReportGeneratedId(qa.id)}
                      className="w-full text-xs font-semibold text-zinc-500 text-black bg-white py-3.5 rounded-lg hover:bg-zinc-100 transition-colors mt-2 active:scale-95 shadow-md border border-black/5"
                    >
                      View Full Report
                    </button>
                  </motion.div>
                )
              })}
            </div>

            {/* Desktop view */}
            <Card className="hidden md:block bg-white/40 dark:bg-black/20 backdrop-blur-xl border-black/5 dark:border-white/5 rounded-[24px] overflow-hidden shadow-xl">
              <div className="overflow-x-auto w-full custom-scrollbar">
                <table className="w-full text-left font-sans whitespace-nowrap min-w-[800px]">
                  <thead className="bg-black/5 dark:bg-white/5 text-zinc-500 text-xs font-semibold text-zinc-500 border-b border-black/10 dark:border-white/10">
                    <tr>
                      <th className="px-6 py-5">Check ID / Date</th>
                      <th className="px-6 py-5">Order Ref</th>
                      <th className="px-6 py-5">Metrics</th>
                      <th className="px-6 py-5 hidden lg:table-cell">Defects</th>
                      <th className="px-6 py-5">Result</th>
                      <th className="px-6 py-5 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/5 text-zinc-900 dark:text-white">
                    {filteredChecks.map((qa, idx) => {
                      const order = orders.find(o => o.id === qa.orderId);
                      
                      return (
                        <motion.tr 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          key={qa.id} 
                          className="hover:bg-white/60 dark:hover:bg-white/5 transition-colors group cursor-default"
                        >
                          <td className="px-6 py-6">
                            <div className="font-semibold text-xs text-zinc-900 dark:text-white">{qa.id}</div>
                            <div className="text-zinc-500 text-xs mt-1.5">
                              {new Date(qa.date).toLocaleString()}
                            </div>
                          </td>
                          <td className="px-6 py-6">
                            <div className="font-semibold text-orange-500 text-sm tracking-tight">{order?.orderNumber || qa.orderId}</div>
                          </td>
                          <td className="px-6 py-6">
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                              <span className="text-zinc-500 font-semibold text-xs">Adhesion:</span>
                              <span className="font-semibold text-zinc-900 dark:text-white">{qa.adhesionScore}/10</span>
                              <span className="text-zinc-500 font-semibold text-xs">Thickness:</span>
                              <span className="font-semibold text-zinc-900 dark:text-white">{qa.thicknessMils} Mils</span>
                            </div>
                          </td>
                          <td className="px-6 py-6 hidden lg:table-cell">
                            {qa.visualDefects.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {qa.visualDefects.map((defect, i) => (
                                  <span key={i} className="px-2.5 py-1 border border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-[6px] backdrop-blur-md">
                                    {defect}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-emerald-500/50 text-xs font-semibold">None</span>
                            )}
                          </td>
                          <td className="px-6 py-6">
                            <span className={cn(
                              "inline-flex items-center px-3 py-1.5 text-xs font-semibold border rounded-md backdrop-blur-md",
                              qa.overallResult === 'Pass' && "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
                              qa.overallResult === 'Fail' && "bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30",
                              qa.overallResult === 'Rework' && "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30"
                            )}>
                              {qa.overallResult}
                            </span>
                          </td>
                          <td className="px-6 py-6 text-right">
                            <button 
                               onClick={() => setReportGeneratedId(qa.id)}
                               className="text-xs font-semibold text-zinc-900 dark:text-white border border-black/10 dark:border-white/20 bg-white/60 dark:bg-black/40 backdrop-blur-md px-4 py-2 rounded-[10px] hover:bg-white hover:text-black hover:border-black/20 transition-all shadow-sm active:scale-95"
                             >
                              Report
                            </button>
                          </td>
                        </motion.tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
        </div>
      )}

      <Modal isOpen={isStickerModalOpen} onClose={() => setIsStickerModalOpen(false)} title="Generate Packing Sticker">
        <div className="space-y-6 print:hidden p-2 md:p-6">
          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-3 px-1">Brand / Company</label>
            <div className="flex gap-3">
              <button
                onClick={() => setStickerData({...stickerData, company: 'metamorph'})}
                className={cn("flex-1 py-4 px-4 rounded-xl border text-xs font-semibold transition-all", stickerData.company === 'metamorph' ? "bg-orange-500 border-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.3)]" : "bg-white/60 dark:bg-[#111] border-black/10 dark:border-white/10 dark:text-white backdrop-blur-md")}
              >
                Metamorph
              </button>
              <button
                onClick={() => setStickerData({...stickerData, company: 'ameyaa'})}
                className={cn("flex-1 py-4 px-4 rounded-xl border text-xs font-semibold transition-all", stickerData.company === 'ameyaa' ? "bg-[#2e3192] border-[#2e3192] text-white shadow-[0_0_20px_rgba(46,49,146,0.3)]" : "bg-white/60 dark:bg-[#111] border-black/10 dark:border-white/10 dark:text-white backdrop-blur-md")}
              >
                Ameyaa
              </button>
            </div>
          </div>
          {stickerData.company === 'metamorph' && (
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-3 px-1">Target Order (Optional)</label>
              <select 
                onChange={(e) => {
                  const o = orders.find(order => order.id === e.target.value);
                  if (o) setStickerData({...stickerData, customer: o.customerName});
                }}
                className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors appearance-none font-semibold mb-2 cursor-pointer shadow-sm"
              >
                <option value="">Select an order to autofill customer...</option>
                {orders.map(o => (
                  <option key={o.id} value={o.id}>{o.orderNumber} - {o.customerName}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-3 px-1">Owner (Customer)</label>
            <input 
              type="text" 
              value={stickerData.customer}
              onChange={e => setStickerData({...stickerData, customer: e.target.value})}
              className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-semibold shadow-sm placeholder:text-zinc-500"
              placeholder="e.g. Telesia"
            />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-3 px-1">Model (Material)</label>
              <input 
                type="text" 
                value={stickerData.model}
                onChange={e => setStickerData({...stickerData, model: e.target.value})}
                className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-semibold shadow-sm placeholder:text-zinc-500"
                placeholder="e.g. D Frame"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-3 px-1">Size</label>
              <input 
                type="text" 
                value={stickerData.size}
                onChange={e => setStickerData({...stickerData, size: e.target.value})}
                className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-semibold shadow-sm placeholder:text-zinc-500"
                placeholder="e.g. 4800"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-3 px-1">Shade</label>
              <input 
                type="text" 
                value={stickerData.shade}
                onChange={e => setStickerData({...stickerData, shade: e.target.value})}
                className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-semibold shadow-sm placeholder:text-zinc-500"
                placeholder="e.g. 8040"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-3 px-1">Pieces / Bundle</label>
              <input 
                type="number" 
                value={stickerData.pieces}
                onChange={e => setStickerData({...stickerData, pieces: e.target.value})}
                className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-semibold shadow-sm placeholder:text-zinc-500"
                placeholder="6"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-3 px-1">Total Bundles</label>
              <input 
                type="number" 
                value={stickerData.bundles}
                onChange={e => setStickerData({...stickerData, bundles: e.target.value})}
                className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-semibold shadow-sm placeholder:text-zinc-500"
                placeholder="24"
              />
            </div>
          </div>
          <button 
            onClick={generateStickerPrint}
            className="w-full inline-flex items-center justify-center bg-orange-500 text-white font-semibold py-5 rounded-xl mt-8 hover:bg-orange-400 transition-colors shadow-[0_0_20px_rgba(249,115,22,0.3)] active:scale-95 text-sm"
          >
            <Printer className="w-4 h-4 mr-3" />
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
                                  
                                  <div className="lbl" style={{ top: '69%' }}>Pieces<span style={{ display: 'inline-block', marginLeft: '15px' }}>:</span></div>
                                  <div className="val" style={{ top: '69%' }}>{stickerData.pieces || ''}</div>
                                  
                                  <div className="lbl" style={{ top: '80%' }}>Bundle No<span style={{ display: 'inline-block', marginLeft: '2px' }}>:</span></div>
                                  <div className="val" style={{ top: '80%' }}>{bundleNo}</div>
                                </div>
                              </td>
                            );
                          }
                          return <td key={col} className="sticker-cell"></td>;
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
    </motion.div>
  );
}
