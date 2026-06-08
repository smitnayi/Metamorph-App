import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataStore } from '../store/data';
import { useAuth } from '../contexts/AuthContext';
import { FileText, Beaker, Plus, Droplet, Scale, Activity, Save, ClipboardCheck, AlertTriangle, X, Download } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { LabRoutineCheck, LabSpecialMeasure } from '../types';

export default function Lab() {
  const [activeTab, setActiveTab] = useState<'routine' | 'special'>('routine');
  const { labRoutineChecks, labSpecialMeasures } = useDataStore();
  const [showExportMenu, setShowExportMenu] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const hasRoutineToday = labRoutineChecks.some(c => c.date === today);

  const navigate = useNavigate();

  const handleExport = (range: string) => {
     navigate(`/export-lab?range=${range}`);
     setShowExportMenu(false);
  }

  return (
    <div className="h-full flex flex-col pt-4 md:pt-8 md:p-8 max-w-7xl mx-auto w-full">
      {!hasRoutineToday && (
         <div className="mx-4 md:mx-0 mb-6 bg-rose-500/10 border border-rose-500/20 rounded-[20px] p-4 flex items-start sm:items-center gap-4">
            <div className="h-12 w-12 bg-rose-500/20 rounded-full flex items-center justify-center shrink-0 text-rose-600 dark:text-rose-400">
               <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="flex-1">
               <h3 className="text-xs font-black uppercase tracking-widest text-rose-600 dark:text-rose-400 mb-0.5 mt-1 sm:mt-0">Missing Daily Report</h3>
               <p className="text-sm font-medium text-rose-700/80 dark:text-rose-300 text-balance leading-tight">Today's chemical process control sheet has not been filled out yet. Please complete the routine checks.</p>
            </div>
            <div className="hidden sm:block shrink-0">
               <button onClick={() => setActiveTab('routine')} className="bg-rose-500 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-600 transition-colors shadow-sm">
                 Fill Now
               </button>
            </div>
         </div>
      )}

      <div className="px-4 md:px-0 mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <Beaker className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-900 dark:text-white">Chemical Lab</h1>
              <p className="text-zinc-600 dark:text-zinc-400 font-medium text-sm">Process control sheets and chemical checks</p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('routine')}
              className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === 'routine' 
                  ? 'bg-white dark:bg-black text-zinc-900 dark:text-white shadow-sm' 
                  : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            >
              Routine Checks
            </button>
            <button
              onClick={() => setActiveTab('special')}
              className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === 'special' 
                  ? 'bg-white dark:bg-black text-zinc-900 dark:text-white shadow-sm' 
                  : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            >
              Special Measures
            </button>
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="w-full sm:w-auto bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-zinc-900 dark:text-white px-4 py-3 sm:py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
            >
              <Download className="h-4 w-4" /> Export Report
            </button>
            
            {showExportMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
                <div className="absolute right-0 mt-2 w-full sm:w-48 bg-white dark:bg-[#111] border border-black/5 dark:border-white/5 shadow-xl rounded-2xl p-2 z-50">
                  <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-3 py-2 mb-1">Select Range</div>
                  <button onClick={() => handleExport('1d')} className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold hover:bg-orange-500/10 hover:text-orange-600 dark:text-white dark:hover:text-orange-400">1 Day (Today)</button>
                  <button onClick={() => handleExport('1w')} className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold hover:bg-orange-500/10 hover:text-orange-600 dark:text-white dark:hover:text-orange-400">1 Week</button>
                  <button onClick={() => handleExport('1m')} className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold hover:bg-orange-500/10 hover:text-orange-600 dark:text-white dark:hover:text-orange-400">1 Month</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-4 md:px-0 scrollbar-hide pb-24 md:pb-8">
        {activeTab === 'routine' ? <RoutineChecksTab /> : <SpecialMeasuresTab />}
      </div>
    </div>
  );
}

function RoutineChecksTab() {
  const { labRoutineChecks, setLabRoutineChecks } = useDataStore();
  const { currentUser } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCheck, setNewCheck] = useState<Partial<LabRoutineCheck>>({
    date: new Date().toISOString().split('T')[0],
  });

  const handleSave = () => {
    if (!newCheck.date) return toast.error("Date is required");
    const check: LabRoutineCheck = {
      id: editingId || Math.random().toString(36).substr(2, 9),
      date: newCheck.date,
      degreaseAlkali: Number(newCheck.degreaseAlkali) || 0,
      degreaseTime: Number(newCheck.degreaseTime) || 0,
      rinse1Alkali: Number(newCheck.rinse1Alkali) || 0,
      rinse1Time: Number(newCheck.rinse1Time) || 0,
      desmutAcid: Number(newCheck.desmutAcid) || 0,
      desmutTime: Number(newCheck.desmutTime) || 0,
      rinse2Acid: Number(newCheck.rinse2Acid) || 0,
      rinse2Time: Number(newCheck.rinse2Time) || 0,
      alCoatingAcid: Number(newCheck.alCoatingAcid) || 0,
      alCoatingFreeAcid: Number(newCheck.alCoatingFreeAcid) || 0,
      alCoatingTime: Number(newCheck.alCoatingTime) || 0,
      rinse3Acid: Number(newCheck.rinse3Acid) || 0,
      rinse3Time: Number(newCheck.rinse3Time) || 0,
      rinse4pH: Number(newCheck.rinse4pH) || 0,
      rinse4Cond: Number(newCheck.rinse4Cond) || 0,
      rinse4Time: Number(newCheck.rinse4Time) || 0,
      inspectorName: currentUser?.name || 'Unknown',
      notes: newCheck.notes || '',
    };
    
    if (editingId) {
      setLabRoutineChecks(labRoutineChecks.map(c => c.id === editingId ? check : c));
      toast.success("Routine check updated");
    } else {
      setLabRoutineChecks([...labRoutineChecks, check]);
      toast.success("Routine check saved");
    }
    
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (check: LabRoutineCheck) => {
    setNewCheck(check);
    setEditingId(check.id);
    setIsAdding(true);
  };

  if (isAdding) {
    return (
      <div className="bg-white/60 dark:bg-[#111]/60 backdrop-blur-3xl rounded-[24px] border border-black/5 dark:border-white/5 shadow-sm p-5 md:p-8 max-w-4xl">
        <div className="flex flex-col mb-8 gap-4">
          <h2 className="text-lg md:text-xl font-black uppercase tracking-tight">{editingId ? "Edit Control Check Sheet" : "New Control Check Sheet"}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
             <input type="date" value={newCheck.date} onChange={e => setNewCheck({...newCheck, date: e.target.value})} className="w-full bg-white dark:bg-black border border-black/5 dark:border-white/5 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-mono" />
             <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="w-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-zinc-900 dark:text-white px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
               <X className="h-4 w-4" /> Cancel
             </button>
             <button onClick={handleSave} className="w-full bg-orange-500 text-black px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 shadow-sm">
               <Save className="h-4 w-4" /> {editingId ? "Update" : "Save"}
             </button>
          </div>
        </div>

        <div className="space-y-8">
          <Section title="1. Degrease (Gardoclean 421)">
            <Field label="Total Alkali (ml) [32.0-42.0]" value={newCheck.degreaseAlkali} onChange={v => setNewCheck({...newCheck, degreaseAlkali: v})} />
            <Field label="Time (Min) [3.0-5.0]" value={newCheck.degreaseTime} onChange={v => setNewCheck({...newCheck, degreaseTime: v})} />
          </Section>
          
          <Section title="2. Water Rinse - 1 (Industrial Water)">
            <Field label="Total Alkali (ml) [<5.0]" value={newCheck.rinse1Alkali} onChange={v => setNewCheck({...newCheck, rinse1Alkali: v})} />
            <Field label="Time (Min) [1.0-2.0]" value={newCheck.rinse1Time} onChange={v => setNewCheck({...newCheck, rinse1Time: v})} />
          </Section>

          <Section title="3. Desmut (Gardacid P 4307)">
            <Field label="Total Acid (ml) [22.0-30.0]" value={newCheck.desmutAcid} onChange={v => setNewCheck({...newCheck, desmutAcid: v})} />
            <Field label="Time (Min) [3.0-6.0]" value={newCheck.desmutTime} onChange={v => setNewCheck({...newCheck, desmutTime: v})} />
          </Section>

          <Section title="4. Water Rinse - 2 (Industrial Water)">
            <Field label="Total Acid (ml) [<5.0]" value={newCheck.rinse2Acid} onChange={v => setNewCheck({...newCheck, rinse2Acid: v})} />
            <Field label="Time (Min) [1.0-2.0]" value={newCheck.rinse2Time} onChange={v => setNewCheck({...newCheck, rinse2Time: v})} />
          </Section>
          
          <Section title="5. Al Conversion Coat (Gardobond 711)">
            <Field label="Total Acid (ml) [11.0-14.0]" value={newCheck.alCoatingAcid} onChange={v => setNewCheck({...newCheck, alCoatingAcid: v})} />
            <Field label="Free Acid (ml) [2.5-4.0]" value={newCheck.alCoatingFreeAcid} onChange={v => setNewCheck({...newCheck, alCoatingFreeAcid: v})} />
            <Field label="Time (Min) [3.0-5.0]" value={newCheck.alCoatingTime} onChange={v => setNewCheck({...newCheck, alCoatingTime: v})} />
          </Section>

          <Section title="6. Water Rinse - 3 (Industrial Water)">
            <Field label="Total Acid (ml) [<5.0]" value={newCheck.rinse3Acid} onChange={v => setNewCheck({...newCheck, rinse3Acid: v})} />
            <Field label="Time (Min) [1.0-2.0]" value={newCheck.rinse3Time} onChange={v => setNewCheck({...newCheck, rinse3Time: v})} />
          </Section>

          <Section title="7. Water Rinse - 4 (DM Water)">
            <Field label="pH [6.5-7.5]" value={newCheck.rinse4pH} onChange={v => setNewCheck({...newCheck, rinse4pH: v})} />
            <Field label="Cond.(Mic siems) [<50.0]" value={newCheck.rinse4Cond} onChange={v => setNewCheck({...newCheck, rinse4Cond: v})} />
            <Field label="Time (Min) [1.0-2.0]" value={newCheck.rinse4Time} onChange={v => setNewCheck({...newCheck, rinse4Time: v})} />
          </Section>

          <div>
             <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Inspector Note / Remark</label>
             <textarea 
               value={newCheck.notes} 
               onChange={e => setNewCheck({...newCheck, notes: e.target.value})}
               className="w-full bg-black/5 dark:bg-white/5 border border-transparent rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-orange-500 focus:bg-white dark:focus:bg-black transition-all min-h-[100px]"
               placeholder="Any remarks..."
             />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-lg font-black uppercase tracking-tight">Recent Check Sheets</h2>
        <button onClick={() => {
            setNewCheck({ date: new Date().toISOString().split('T')[0] });
            setEditingId(null);
            setIsAdding(true);
        }} className="bg-orange-500 text-black px-4 py-2 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-orange-600 transition-colors shadow-sm w-full sm:w-auto inline-flex items-center justify-center gap-2">
           <Plus className="h-4 w-4" /> New Sheet
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {labRoutineChecks.map(check => (
           <div key={check.id} onClick={() => handleEdit(check)} className="bg-white/60 dark:bg-black/40 backdrop-blur-3xl border border-black/[0.04] dark:border-white/[0.06] rounded-[24px] p-6 shadow-sm flex flex-col cursor-pointer hover:shadow-md transition-shadow">
             <div className="flex items-start justify-between mb-4">
               <div>
                 <div className="text-[10px] font-bold uppercase tracking-widest text-orange-500 mb-1">Process Check</div>
                 <div className="text-lg font-black text-zinc-900 dark:text-white leading-tight">{format(new Date(check.date), 'MMM dd, yyyy')}</div>
               </div>
               <div className="h-10 w-10 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-600">
                 <FileText className="h-4 w-4" />
               </div>
             </div>
             
             <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-6 flex-1">
                Completed by {check.inspectorName}
             </div>
             
             <div className="grid grid-cols-2 gap-2 text-xs font-medium text-zinc-500 border-t border-black/5 dark:border-white/5 pt-4">
                <span>Al.Coat Acid: <strong className="text-zinc-900 dark:text-zinc-100">{check.alCoatingAcid}</strong></span>
                <span>Rinse4 pH: <strong className="text-zinc-900 dark:text-zinc-100">{check.rinse4pH}</strong></span>
             </div>
           </div>
        ))}
        {labRoutineChecks.length === 0 && (
           <div className="col-span-full py-12 flex flex-col items-center justify-center text-center bg-black/5 dark:bg-white/5 rounded-3xl border border-dashed border-black/10 dark:border-white/10">
              <ClipboardCheck className="h-12 w-12 text-zinc-400 mb-4" />
              <h3 className="text-lg font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-300">No Routine Checks</h3>
              <p className="text-sm font-medium text-zinc-500 mt-1 max-w-sm">Create a daily process control check sheet to track chemical concentrations.</p>
           </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="border border-black/5 dark:border-white/5 rounded-2xl p-5 bg-black/[0.02] dark:bg-white/[0.01]">
      <h3 className="text-sm font-black uppercase tracking-widest mb-4 border-b border-black/5 dark:border-white/5 pb-2 text-zinc-800 dark:text-zinc-200">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {children}
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string, value: any, onChange: (v: string) => void }) {
  return (
    <div>
       <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5 px-1">{label}</label>
       <input 
         type="number" step="any"
         value={value || ''} 
         onChange={e => onChange(e.target.value)}
         className="w-full bg-white dark:bg-black border border-black/5 dark:border-white/5 rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-mono"
         placeholder="0.0"
       />
    </div>
  );
}

function SpecialMeasuresTab() {
  const { labSpecialMeasures, setLabSpecialMeasures } = useDataStore();
  const { currentUser } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newMeasure, setNewMeasure] = useState<Partial<LabSpecialMeasure>>({
    date: new Date().toISOString().split('T')[0],
    measureType: 'Etch Rate'
  });

  const handleSave = () => {
    if (!newMeasure.value) return toast.error("Value is required");
    const measure: LabSpecialMeasure = {
      id: editingId || Math.random().toString(36).substr(2, 9),
      date: newMeasure.date || new Date().toISOString().split('T')[0],
      measureType: newMeasure.measureType as any || 'Etch Rate',
      value: Number(newMeasure.value),
      inspectorName: currentUser?.name || 'Unknown',
      notes: newMeasure.notes
    };
    
    if (editingId) {
      setLabSpecialMeasures(labSpecialMeasures.map(m => m.id === editingId ? measure : m));
      toast.success(`${measure.measureType} updated`);
    } else {
      setLabSpecialMeasures([...labSpecialMeasures, measure]);
      toast.success(`${measure.measureType} logged`);
    }
    
    setIsAdding(false);
    setEditingId(null);
    setNewMeasure({ date: new Date().toISOString().split('T')[0], measureType: 'Etch Rate' });
  };

  const handleEdit = (measure: LabSpecialMeasure) => {
    setNewMeasure(measure);
    setEditingId(measure.id);
    setIsAdding(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-lg font-black uppercase tracking-tight">Special Measurements</h2>
        <button onClick={() => {
            setNewMeasure({ date: new Date().toISOString().split('T')[0], measureType: 'Etch Rate' });
            setEditingId(null);
            setIsAdding(true);
        }} className="bg-orange-500 text-black px-4 py-2 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-orange-600 transition-colors shadow-sm w-full sm:w-auto inline-flex items-center justify-center gap-2">
           <Plus className="h-4 w-4" /> Add Record
        </button>
      </div>

      {isAdding && (
        <div className="bg-white/60 dark:bg-black/40 backdrop-blur-3xl border border-orange-500/20 rounded-[24px] p-6 shadow-sm max-w-xl">
           <div className="space-y-4">
              <div className="flex flex-col gap-1">
                 <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Date</label>
                 <input type="date" value={newMeasure.date} onChange={e => setNewMeasure({...newMeasure, date: e.target.value})} className="bg-white dark:bg-[#111] border border-black/10 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-orange-500" />
              </div>
              <div className="flex flex-col gap-1">
                 <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Measure Type</label>
                 <select value={newMeasure.measureType} onChange={e => setNewMeasure({...newMeasure, measureType: e.target.value as any})} className="bg-white dark:bg-[#111] border border-black/10 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-orange-500 appearance-none cursor-pointer">
                   <option value="Etch Rate">Etch Rate</option>
                   <option value="Oil Content">Oil Content</option>
                   <option value="Chrome Weight">Chrome Weight</option>
                 </select>
              </div>
              <div className="flex flex-col gap-1">
                 <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Measured Value</label>
                 <input type="number" step="any" value={newMeasure.value || ''} onChange={e => setNewMeasure({...newMeasure, value: Number(e.target.value)})} className="bg-white dark:bg-[#111] border border-black/10 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-orange-500 font-mono" placeholder="0.00" />
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-4">
                 <button onClick={() => {setIsAdding(false); setEditingId(null);}} className="bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-zinc-900 dark:text-white px-4 h-11 sm:h-10 rounded-xl text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2 w-full sm:w-auto">
                   <X className="h-4 w-4" /> <span>Cancel</span>
                 </button>
                 <button onClick={handleSave} className="bg-orange-500 hover:bg-orange-600 text-black px-6 h-11 sm:h-10 rounded-xl text-xs font-black uppercase tracking-widest transition-colors shadow-lg flex items-center justify-center gap-2 w-full sm:w-auto">
                   <Save className="h-4 w-4" /> <span>{editingId ? 'Update Record' : 'Save Record'}</span>
                 </button>
              </div>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {labSpecialMeasures.map(measure => (
            <div key={measure.id} onClick={() => handleEdit(measure)} className="bg-white/60 dark:bg-black/40 backdrop-blur-3xl border border-black/[0.04] dark:border-white/[0.06] rounded-[24px] p-6 shadow-sm flex items-center justify-between hover:shadow-md cursor-pointer transition-all">
               <div className="flex items-center gap-4">
                 <div className="h-12 w-12 rounded-[16px] bg-orange-500/10 flex items-center justify-center text-orange-500">
                    {measure.measureType === 'Etch Rate' ? <Activity className="h-5 w-5" /> : measure.measureType === 'Oil Content' ? <Droplet className="h-5 w-5" /> : <Scale className="h-5 w-5" />}
                 </div>
                 <div>
                   <h3 className="text-sm font-black uppercase tracking-wide text-zinc-900 dark:text-white">{measure.measureType}</h3>
                   <div className="text-[11px] font-bold tracking-widest text-zinc-500 uppercase mt-0.5">{format(new Date(measure.date), 'MMM dd, yyyy')}</div>
                 </div>
               </div>
               <div className="text-right">
                  <div className="text-2xl font-black text-orange-600 font-mono">{measure.value}</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                    {measure.measureType === 'Etch Rate' ? 'Rate' : measure.measureType === 'Oil Content' ? 'g/l' : 'g/m2'}
                  </div>
               </div>
            </div>
        ))}
      </div>
    </div>
  );
}
