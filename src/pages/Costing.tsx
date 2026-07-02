import React, { useState } from 'react';
import { useDataStore } from '../store/data';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Order, OrderCostEstimation } from '../types';
import Modal from '../components/ui/Modal';
import { useNavigate } from 'react-router-dom';
import { Calculator, Settings, Download, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export default function Costing() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { orders, setOrders, costSettings, setCostSettings, qualityChecks, inventory, laborRoles, setLaborRoles } = useDataStore();
  
  if (currentUser?.roleId !== 'role-admin' && currentUser?.roleId !== 'role-manager') {
    return <Navigate to="/" replace />;
  }
  const [costingOrder, setCostingOrder] = useState<Order | null>(null);
  const [isCostConfigOpen, setIsCostConfigOpen] = useState(false);
  const [costingMode, setCostingMode] = useState<'Manual' | 'Automatic'>('Manual');

  const [estimationData, setEstimationData] = useState<OrderCostEstimation>({
    powderKg: 0,
    materialKg: 0,
    labourAllocation: 0,
    officeStaffAllocation: 0,
    rentAllocation: 0,
    electricityUsage: 0,
    gasUsage: 0,
    transportCost: 0,
    miscCost: 0
  });

  const pullQAData = (order: Order) => {
    const qaCheck = qualityChecks.find(c => c.orderId === order.id);
    if (qaCheck && qaCheck.powderUsages && qaCheck.powderUsages.length > 0) {
       const initialPowders = qaCheck.powderUsages.map(usage => {
          const powderInfo = inventory.find(i => i.id === usage.inventoryId);
          return {
             inventoryId: usage.inventoryId,
             name: powderInfo?.name || 'Unknown Powder',
             amountKg: usage.amountKg,
             rate: powderInfo?.perKgRate || 0
          };
       });
       setEstimationData(prev => ({...prev, powders: initialPowders}));
       toast.success("QA Powder data synchronized successfully.");
    } else {
       toast.error("No QA powder usage logs found for this order.");
    }
  };

  const handleOpenCosting = (order: Order) => {
    setCostingOrder(order);
    let initialPowders = order.costEstimation?.powders || [];
    
    // Auto-populate from QA if no existing powder costing
    if (!order.costEstimation?.powders || order.costEstimation.powders.length === 0) {
      const qaCheck = qualityChecks.find(c => c.orderId === order.id);
      if (qaCheck && qaCheck.powderUsages && qaCheck.powderUsages.length > 0) {
         initialPowders = qaCheck.powderUsages.map(usage => {
            const powderInfo = inventory.find(i => i.id === usage.inventoryId);
            return {
               inventoryId: usage.inventoryId,
               name: powderInfo?.name || 'Unknown Powder',
               amountKg: usage.amountKg,
               rate: powderInfo?.perKgRate || 0
            };
         });
      }
    }

    setEstimationData(order.costEstimation || {
      powderKg: 0,
      materialKg: 0,
      powders: initialPowders,
      labourAllocation: 0,
      officeStaffAllocation: 0,
      rentAllocation: 0,
      electricityUsage: 0,
      gasUsage: 0,
      transportCost: 0,
      miscCost: 0
    });
    
    if (order.costEstimation && initialPowders.length > 0) {
       setEstimationData(prev => ({...prev, powders: initialPowders}));
    } else if (!order.costEstimation && initialPowders.length > 0) {
       setEstimationData(prev => ({...prev, powders: initialPowders}));
    }
  };

  const handleSaveCosting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!costingOrder) return;
    
    // Calculate total powder cost from powders array
    const totalPowderCost = (estimationData.powders || []).reduce((acc, p) => acc + (p.amountKg * (p.rate || 0)), 0);
    const fallbackPowderCost = estimationData.powderKg || 0; // Legacy / Fallback
    
    const finalPowderCost = totalPowderCost > 0 ? totalPowderCost : fallbackPowderCost;
    
    // Material cost per kg is calculated differently now if using arrays, but let's just keep calculatedPowderRate logic
    const powderRate = estimationData.materialKg ? finalPowderCost / estimationData.materialKg : 0;
    const electricityCost = estimationData.electricityUsage * costSettings.electricityRate;
    const gasCost = estimationData.gasUsage * costSettings.gasRate;
    const processCharge = estimationData.materialKg * costSettings.processChargeRate;
    
    const totalCost = Number(estimationData.labourAllocation) + 
                      Number(estimationData.officeStaffAllocation) + 
                      Number(estimationData.rentAllocation) + 
                      electricityCost + gasCost + processCharge + 
                      finalPowderCost +
                      Number(estimationData.transportCost) + 
                      Number(estimationData.miscCost);
                      
    const profit = costingOrder.totalValue - totalCost;

    const finalData = {
      ...estimationData,
      powderKg: finalPowderCost, // Save the actual total cost here for backwards compat
      calculatedPowderRate: powderRate,
      calculatedElectricityCost: electricityCost,
      calculatedGasCost: gasCost,
      calculatedProcessCharge: processCharge,
      calculatedTotalCost: totalCost,
      calculatedProfit: profit
    };

    setOrders(prev => prev.map(o => o.id === costingOrder.id ? { ...o, costEstimation: finalData } : o));
    
    setCostingOrder(null);
    toast.success('Cost estimation saved');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 md:p-8 max-w-7xl mx-auto space-y-8"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-8">
        <div>
          <label className="text-xs md:text-xs font-semibold text-orange-500">Finance</label>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mt-1 text-zinc-900 dark:text-white">Costing</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2 font-medium text-sm">Manage order costs and profit margins.</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsCostConfigOpen(true)}
          className="bg-white/60 dark:bg-[#111]/80 backdrop-blur-md border border-black/10 dark:border-white/10 text-zinc-900 dark:text-white px-6 py-4 md:py-5 rounded-xl text-xs font-semibold hover:bg-white dark:hover:bg-black hover:border-black/20 dark:hover:border-white/20 transition-all flex items-center gap-3 shadow-sm active:scale-95"
        >
          <Settings className="w-5 h-5 text-orange-500" /> Global Rates
        </motion.button>
      </div>

      <div className="bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-[32px] overflow-hidden shadow-2xl relative">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-black/5 dark:bg-white/5 text-zinc-500 text-xs font-semibold text-zinc-500 border-b border-black/10 dark:border-white/10">
              <tr>
                <th className="px-6 py-5">Order / Customer</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5">Revenue</th>
                <th className="px-6 py-5">Cost</th>
                <th className="px-6 py-5">Profit</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5 text-zinc-900 dark:text-white">
              {orders.map((order, idx) => {
                const isCalculated = !!order.costEstimation;
                return (
                 <motion.tr 
                   initial={{ opacity: 0, x: -10 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: idx * 0.05 }}
                   key={order.id} 
                   className="hover:bg-white/60 dark:hover:bg-white/5 transition-colors group cursor-default"
                 >
                  <td className="px-6 py-6">
                    <div className="font-semibold text-orange-500 text-sm tracking-tight">{order.orderNumber}</div>
                    <div className="text-sm font-semibold text-zinc-500 mt-1">{order.customerName}</div>
                  </td>
                  <td className="px-6 py-6">
                    <span className="text-xs font-semibold tracking-widest uppercase bg-black/5 dark:bg-white/10 px-2.5 py-1.5 rounded-md border border-black/5 dark:border-white/5">{order.status}</span>
                  </td>
                  <td className="px-6 py-6 font-semibold text-emerald-500 text-sm tracking-tight">
                    ₹{order.totalValue.toLocaleString()}
                  </td>
                  <td className="px-6 py-6 font-semibold text-zinc-600 dark:text-zinc-400 text-sm">
                    {isCalculated ? `₹${order.costEstimation?.calculatedTotalCost?.toLocaleString()}` : '-'}
                  </td>
                  <td className="px-6 py-6">
                    {isCalculated && order.costEstimation?.calculatedProfit ? (
                      <span className={cn(
                        "font-semibold tracking-tight text-sm",
                        order.costEstimation.calculatedProfit > 0 ? 'text-emerald-500' : 'text-rose-500'
                      )}>
                        ₹{order.costEstimation.calculatedProfit.toLocaleString()}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-6 text-right">
                    <div className="flex items-center justify-end gap-3">
                       {isCalculated && (
                         <button 
                          onClick={() => navigate(`/export/${order.id}`)}
                          className="p-2.5 text-zinc-400 hover:text-orange-500 hover:bg-orange-500/10 rounded-xl transition-all"
                          title="Export Cost Sheet"
                         >
                           <Download className="w-4 h-4" />
                         </button>
                       )}
                       <button
                         onClick={() => handleOpenCosting(order)}
                         className="flex items-center gap-2 px-5 py-3 bg-white/60 dark:bg-[#111] backdrop-blur-md border border-black/10 dark:border-white/10 hover:border-orange-500 dark:hover:border-orange-500 hover:bg-orange-500/10 hover:text-orange-600 dark:hover:text-orange-400 rounded-lg text-xs font-semibold text-zinc-500 transition-all shadow-sm active:scale-95 text-zinc-900 dark:text-white"
                       >
                         <Calculator className="w-4 h-4 text-orange-500" />
                         {isCalculated ? 'Edit Costing' : 'Compute'}
                       </button>
                    </div>
                  </td>
                 </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isCostConfigOpen} onClose={() => setIsCostConfigOpen(false)} title="Global Cost Rates">
        <form onSubmit={(e) => { e.preventDefault(); toast.success('Rates updated'); setIsCostConfigOpen(false); }} className="space-y-6 p-2 md:p-6">
          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-3 px-1">Electricity Rate (₹/unit)</label>
            <input 
              type="number" min="0" step="0.1" value={costSettings.electricityRate || 0}
              onChange={e => setCostSettings({...costSettings, electricityRate: Number(e.target.value)})}
              className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 font-semibold transition-colors shadow-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-3 px-1">Gas Rate (₹/unit)</label>
            <input 
              type="number" min="0" step="0.1" value={costSettings.gasRate || 0}
              onChange={e => setCostSettings({...costSettings, gasRate: Number(e.target.value)})}
              className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 font-semibold transition-colors shadow-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-3 px-1">Process Charge Rate (₹/kg)</label>
            <input 
              type="number" min="0" step="0.1" value={costSettings.processChargeRate || 0}
              onChange={e => setCostSettings({...costSettings, processChargeRate: Number(e.target.value)})}
              className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 font-semibold transition-colors shadow-sm"
            />
          </div>

          <div className="pt-6 border-t border-black/10 dark:border-white/10">
            <div className="flex justify-between items-center mb-4">
              <label className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-[0.05em] px-1">Labor Roles & Shifts</label>
              <button 
                type="button" 
                onClick={() => setLaborRoles([...laborRoles, { id: 'role-' + Date.now(), name: 'New Role', shiftHours: 8 }])}
                className="text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors bg-orange-500/10 px-3 py-1.5 rounded-lg border border-orange-500/20 active:scale-95"
              >
                + Add Role
              </button>
            </div>
            <div className="space-y-3">
              {laborRoles.map((role, idx) => (
                <div key={role.id} className="flex gap-3 items-center">
                  <div className="flex-1">
                    <input 
                      type="text" 
                      value={role.name}
                      placeholder="Role Name (e.g., Male)"
                      onChange={e => {
                        const newRoles = [...laborRoles];
                        newRoles[idx].name = e.target.value;
                        setLaborRoles(newRoles);
                      }}
                      className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 font-semibold transition-colors shadow-sm text-sm"
                    />
                  </div>
                  <div className="w-32 relative">
                    <input 
                      type="number" 
                      min="0" step="0.5" 
                      value={role.shiftHours || 0}
                      onChange={e => {
                        const newRoles = [...laborRoles];
                        newRoles[idx].shiftHours = Number(e.target.value);
                        setLaborRoles(newRoles);
                      }}
                      className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 font-semibold transition-colors shadow-sm text-sm pr-10"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">HRS</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      if (confirm('Delete this role?')) {
                        setLaborRoles(laborRoles.filter(r => r.id !== role.id));
                      }
                    }}
                    className="p-3 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button type="submit" className="w-full bg-orange-500 text-white font-semibold py-5 rounded-xl mt-8 hover:bg-orange-400 transition-colors flex justify-center shadow-[0_0_20px_rgba(249,115,22,0.3)] active:scale-[0.98] text-sm">
            Save Configuration
          </button>
        </form>
      </Modal>

      <Modal isOpen={!!costingOrder} onClose={() => setCostingOrder(null)} size="2xl" title={`Costing: ${costingOrder?.orderNumber}`}>
        <form onSubmit={handleSaveCosting} className="space-y-8 p-2 md:p-6">
          <div className="border-b border-black/5 dark:border-white/5 pb-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-4">
                <label className="text-sm font-semibold text-zinc-900 dark:text-white">Powder Costs</label>
                <div className="flex bg-black/5 dark:bg-white/5 rounded-lg p-1">
                   <button type="button" onClick={() => setCostingMode('Manual')} className={cn("px-3 py-1 text-xs font-semibold rounded-md transition-colors", costingMode === 'Manual' ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300")}>Manual</button>
                   <button type="button" onClick={() => { setCostingMode('Automatic'); if (costingOrder) pullQAData(costingOrder); }} className={cn("px-3 py-1 text-xs font-semibold rounded-md transition-colors", costingMode === 'Automatic' ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300")}>Automatic (QA)</button>
                </div>
              </div>
              {costingMode === 'Manual' && <button type="button" onClick={() => setEstimationData({...estimationData, powders: [...(estimationData.powders || []), {inventoryId: '', name: '', amountKg: 0, rate: 0}]})} className="text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors bg-orange-500/10 px-3 py-1.5 rounded-lg border border-orange-500/20 active:scale-95">+ Add Powder</button>}
            </div>
            <div className="space-y-4">
              {(estimationData.powders || []).map((powder, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-black/5 dark:bg-white/5 p-4 rounded-xl">
                  <select 
                    value={powder.inventoryId}
                    disabled={costingMode === 'Automatic'}
                    onChange={(e) => {
                      const selectedItem = inventory.find(i => i.id === e.target.value);
                      const newPowders = [...(estimationData.powders || [])];
                      newPowders[idx] = {
                        ...newPowders[idx],
                        inventoryId: e.target.value,
                        name: selectedItem?.name || '',
                        rate: selectedItem?.perKgRate || 0
                      };
                      setEstimationData({...estimationData, powders: newPowders});
                    }}
                    className={cn("flex-1 w-full sm:w-auto px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 text-sm font-medium appearance-none", costingMode === 'Automatic' && "opacity-60 cursor-not-allowed")}
                  >
                    <option value="">Select Powder...</option>
                    {inventory.map(item => (
                      <option key={item.id} value={item.id}>{item.name} - ₹{item.perKgRate || 0}/kg</option>
                    ))}
                  </select>
                  
                  <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                    <div className="relative flex-1 sm:flex-none">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-medium">₹</span>
                      <input
                        type="number" step="0.01" min="0" placeholder="Rate"
                        value={powder.rate || ''}
                        disabled={costingMode === 'Automatic'}
                        onChange={(e) => {
                          const newPowders = [...(estimationData.powders || [])];
                          newPowders[idx].rate = Number(e.target.value);
                          setEstimationData({...estimationData, powders: newPowders});
                        }}
                        className={cn("w-full sm:w-32 pl-7 pr-3 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 text-sm font-medium", costingMode === 'Automatic' && "opacity-60 cursor-not-allowed")}
                      />
                    </div>
                    <div className="relative flex-1 sm:flex-none">
                      <input
                        type="number" step="0.01" min="0" placeholder="Qty"
                        value={powder.amountKg || ''}
                        disabled={costingMode === 'Automatic'}
                        onChange={(e) => {
                          const newPowders = [...(estimationData.powders || [])];
                          newPowders[idx].amountKg = Number(e.target.value);
                          setEstimationData({...estimationData, powders: newPowders});
                        }}
                        className={cn("w-full sm:w-32 px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 text-sm font-medium", costingMode === 'Automatic' && "opacity-60 cursor-not-allowed")}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-medium pointer-events-none">kg</span>
                    </div>
                    {costingMode === 'Manual' && (
                      <button type="button" onClick={() => {
                        const newPowders = [...(estimationData.powders || [])];
                        newPowders.splice(idx, 1);
                        setEstimationData({...estimationData, powders: newPowders});
                      }} className="p-3 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-colors border border-rose-500/20 active:scale-95">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {(!estimationData.powders || estimationData.powders.length === 0) && (
                 <div className="text-sm text-zinc-500 font-medium p-4 bg-black/5 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5 border-dashed text-center">
                   No powders added. Click "+ Add Powder" or manually enter total fallback cost below.
                 </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
             <div>
               <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-3 px-1">Powder Fallback (₹)</label>
               <input type="number" min="0" step="0.0001" onFocus={e => e.target.select()} value={estimationData.powderKg || ''} onChange={e => setEstimationData({...estimationData, powderKg: Number(e.target.value)})} className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 text-sm transition-colors shadow-sm" placeholder="Used if no powders listed" />
             </div>
             <div>
               <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-3 px-1">Material (kg)</label>
               <input type="number" min="0" step="0.0001" onFocus={e => e.target.select()} value={estimationData.materialKg || ''} onChange={e => setEstimationData({...estimationData, materialKg: Number(e.target.value)})} className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 text-sm transition-colors shadow-sm" />
             </div>
             <div>
               <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-3 px-1">Labour (₹)</label>
               <input type="number" min="0" step="0.0001" onFocus={e => e.target.select()} value={estimationData.labourAllocation || ''} onChange={e => setEstimationData({...estimationData, labourAllocation: Number(e.target.value)})} className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 text-sm transition-colors shadow-sm" />
             </div>
             <div>
               <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-3 px-1">Office Staff (₹)</label>
               <input type="number" min="0" step="0.0001" onFocus={e => e.target.select()} value={estimationData.officeStaffAllocation || ''} onChange={e => setEstimationData({...estimationData, officeStaffAllocation: Number(e.target.value)})} className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 text-sm transition-colors shadow-sm" />
             </div>
             <div>
               <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-3 px-1">Rent (₹)</label>
               <input type="number" min="0" step="0.0001" onFocus={e => e.target.select()} value={estimationData.rentAllocation || ''} onChange={e => setEstimationData({...estimationData, rentAllocation: Number(e.target.value)})} className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 text-sm transition-colors shadow-sm" />
             </div>
             <div>
               <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-3 px-1">Electricity Uses</label>
               <input type="number" min="0" step="0.0001" onFocus={e => e.target.select()} value={estimationData.electricityUsage || ''} onChange={e => setEstimationData({...estimationData, electricityUsage: Number(e.target.value)})} className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 text-sm transition-colors shadow-sm" />
             </div>
             <div>
               <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-3 px-1">Gas Uses</label>
               <input type="number" min="0" step="0.0001" onFocus={e => e.target.select()} value={estimationData.gasUsage || ''} onChange={e => setEstimationData({...estimationData, gasUsage: Number(e.target.value)})} className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 text-sm transition-colors shadow-sm" />
             </div>
             <div>
               <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-3 px-1">Transport (₹)</label>
               <input type="number" min="0" step="0.0001" onFocus={e => e.target.select()} value={estimationData.transportCost || ''} onChange={e => setEstimationData({...estimationData, transportCost: Number(e.target.value)})} className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 text-sm transition-colors shadow-sm" />
             </div>
             <div>
               <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-3 px-1">Misc (₹)</label>
               <input type="number" min="0" step="0.0001" onFocus={e => e.target.select()} value={estimationData.miscCost || ''} onChange={e => setEstimationData({...estimationData, miscCost: Number(e.target.value)})} className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 text-sm transition-colors shadow-sm" />
             </div>
          </div>
          
          <div className="bg-white/40 dark:bg-black/20 backdrop-blur-xl p-6 sm:p-8 rounded-[32px] border border-black/10 dark:border-white/10 space-y-4 shadow-inner">
             <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-4 mb-4">
               <h3 className="text-xs font-semibold text-zinc-900 dark:text-white flex items-center">
                 <Calculator className="h-5 w-5 mr-3 text-orange-500" /> Estimation Summary
               </h3>
             </div>
             <div className="flex justify-between text-sm items-center"><span className="text-zinc-500 font-semibold text-xs">Powder Rate</span><span className="font-semibold text-zinc-900 dark:text-white">{estimationData.materialKg ? (estimationData.powderKg / estimationData.materialKg).toFixed(4) : 0}</span></div>
             <div className="flex justify-between text-sm items-center"><span className="text-zinc-500 font-semibold text-xs">Electricity (₹{costSettings.electricityRate})</span><span className="font-semibold text-zinc-900 dark:text-white">₹{((estimationData.electricityUsage || 0) * costSettings.electricityRate).toFixed(0)}</span></div>
             <div className="flex justify-between text-sm items-center"><span className="text-zinc-500 font-semibold text-xs">Gas (₹{costSettings.gasRate})</span><span className="font-semibold text-zinc-900 dark:text-white">₹{((estimationData.gasUsage || 0) * costSettings.gasRate).toFixed(0)}</span></div>
             <div className="flex justify-between text-sm items-center"><span className="text-zinc-500 font-semibold text-xs">Process Charge</span><span className="font-semibold text-zinc-900 dark:text-white">₹{((estimationData.materialKg || 0) * costSettings.processChargeRate).toFixed(0)}</span></div>
             <div className="flex justify-between text-sm items-center"><span className="text-zinc-500 font-semibold text-xs">Revenue (Buyer Cost)</span><span className="font-semibold text-emerald-500">₹{costingOrder?.totalValue.toLocaleString()}</span></div>
             
             <div className="pt-6 mt-6 border-t border-black/5 dark:border-white/5 flex justify-between items-end">
               <span className="text-xs font-semibold text-zinc-500">Calculated Profit</span>
               <span className={cn(
                 "text-4xl font-semibold tracking-tight",
                 ((costingOrder?.totalValue || 0) - (Number(estimationData.labourAllocation) + Number(estimationData.officeStaffAllocation) + Number(estimationData.rentAllocation) + (estimationData.electricityUsage * costSettings.electricityRate) + (estimationData.gasUsage * costSettings.gasRate) + (estimationData.materialKg * costSettings.processChargeRate) + Number(estimationData.transportCost) + Number(estimationData.miscCost))) > 0 ? 'text-emerald-500' : 'text-rose-500'
               )}>
                 ₹{((costingOrder?.totalValue || 0) - (Number(estimationData.labourAllocation) + Number(estimationData.officeStaffAllocation) + Number(estimationData.rentAllocation) + (estimationData.electricityUsage * costSettings.electricityRate) + (estimationData.gasUsage * costSettings.gasRate) + (estimationData.materialKg * costSettings.processChargeRate) + Number(estimationData.transportCost) + Number(estimationData.miscCost))).toFixed(0)}
               </span>
             </div>
          </div>
          
          <button type="submit" className="w-full bg-orange-500 text-white font-semibold py-5 rounded-xl hover:bg-orange-400 transition-colors shadow-[0_0_20px_rgba(249,115,22,0.3)] active:scale-[0.98] text-sm">
            Save Estimation
          </button>
        </form>
      </Modal>
    </motion.div>
  );
}
