import React, { useState } from 'react';
import { useDataStore } from '../store/data';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Order, OrderCostEstimation } from '../types';
import Modal from '../components/ui/Modal';
import { useNavigate } from 'react-router-dom';
import { Calculator, Settings, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function Costing() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { orders, setOrders, costSettings, setCostSettings } = useDataStore();
  
  if (currentUser?.roleId !== 'role-admin' && currentUser?.roleId !== 'role-manager') {
    return <Navigate to="/" replace />;
  }
  const [costingOrder, setCostingOrder] = useState<Order | null>(null);
  const [isCostConfigOpen, setIsCostConfigOpen] = useState(false);
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

  const handleOpenCosting = (order: Order) => {
    setCostingOrder(order);
    setEstimationData(order.costEstimation || {
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
  };

  const handleSaveCosting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!costingOrder) return;
    
    const powderRate = estimationData.materialKg ? estimationData.powderKg / estimationData.materialKg : 0;
    const electricityCost = estimationData.electricityUsage * costSettings.electricityRate;
    const gasCost = estimationData.gasUsage * costSettings.gasRate;
    const processCharge = estimationData.materialKg * costSettings.processChargeRate;
    
    const totalCost = Number(estimationData.labourAllocation) + 
                      Number(estimationData.officeStaffAllocation) + 
                      Number(estimationData.rentAllocation) + 
                      electricityCost + gasCost + processCharge + 
                      Number(estimationData.transportCost) + 
                      Number(estimationData.miscCost);
                      
    const profit = costingOrder.totalValue - totalCost;

    const finalData = {
      ...estimationData,
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
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-widest text-zinc-900 dark:text-white">Costing</h1>
          <p className="text-sm font-bold text-zinc-500 mt-1">Manage order costs and profit</p>
        </div>
        <button 
          onClick={() => setIsCostConfigOpen(true)}
          className="bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-zinc-900 dark:text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-black/10 dark:hover:bg-white/10 transition-colors flex items-center gap-2"
        >
          <Settings className="w-4 h-4" /> Global Rates
        </button>
      </div>

      <div className="bg-white dark:bg-[#111] border border-black/5 dark:border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-[#f4f4f5] dark:bg-[#111] text-zinc-500 text-[10px] font-black uppercase tracking-widest border-b border-black/10 dark:border-white/20">
              <tr>
                <th className="px-6 py-4">Order / Customer</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Revenue</th>
                <th className="px-6 py-4">Cost</th>
                <th className="px-6 py-4">Profit</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/10 text-zinc-900 dark:text-white">
              {orders.map(order => {
                const isCalculated = !!order.costEstimation;
                return (
                 <tr key={order.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-black text-sm">{order.orderNumber}</div>
                    <div className="text-xs text-zinc-500 font-bold">{order.customerName}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-black tracking-widest uppercase bg-black/5 dark:bg-white/10 px-2 py-1 rounded-md">{order.status}</span>
                  </td>
                  <td className="px-6 py-4 font-bold text-emerald-500">
                    ₹{order.totalValue.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 font-bold text-zinc-600 dark:text-zinc-400">
                    {isCalculated ? `₹${order.costEstimation?.calculatedTotalCost?.toLocaleString()}` : '-'}
                  </td>
                  <td className="px-6 py-4">
                    {isCalculated && order.costEstimation?.calculatedProfit ? (
                      <span className={`font-bold ${order.costEstimation.calculatedProfit > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        ₹{order.costEstimation.calculatedProfit.toLocaleString()}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                       {isCalculated && (
                         <button 
                          onClick={() => navigate(`/export/${order.id}`)}
                          className="p-2 text-zinc-400 hover:text-orange-500 hover:bg-orange-500/10 rounded-lg transition-colors"
                          title="Export Invoice"
                         >
                           <Download className="w-4 h-4" />
                         </button>
                       )}
                       <button
                         onClick={() => handleOpenCosting(order)}
                         className="flex items-center gap-2 px-3 py-1.5 bg-black/5 dark:bg-white/5 hover:bg-orange-500 hover:text-black dark:hover:bg-orange-500 rounded-lg text-xs font-bold transition-colors"
                       >
                         <Calculator className="w-3.5 h-3.5" />
                         {isCalculated ? 'Edit Costing' : 'Compute'}
                       </button>
                    </div>
                  </td>
                 </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isCostConfigOpen} onClose={() => setIsCostConfigOpen(false)} title="Global Cost Rates">
        <form onSubmit={(e) => { e.preventDefault(); toast.success('Rates updated'); setIsCostConfigOpen(false); }} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Electricity Rate (₹/unit)</label>
            <input 
              type="number" min="0" step="0.1" value={costSettings.electricityRate || 0}
              onChange={e => setCostSettings({...costSettings, electricityRate: Number(e.target.value)})}
              className="w-full px-4 py-4 rounded-xl border border-black/5 dark:border-white/10 bg-[#f4f4f5] dark:bg-[#111] text-zinc-900 dark:text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Gas Rate (₹/unit)</label>
            <input 
              type="number" min="0" step="0.1" value={costSettings.gasRate || 0}
              onChange={e => setCostSettings({...costSettings, gasRate: Number(e.target.value)})}
              className="w-full px-4 py-4 rounded-xl border border-black/5 dark:border-white/10 bg-[#f4f4f5] dark:bg-[#111] text-zinc-900 dark:text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Process Charge Rate (₹/kg)</label>
            <input 
              type="number" min="0" step="0.1" value={costSettings.processChargeRate || 0}
              onChange={e => setCostSettings({...costSettings, processChargeRate: Number(e.target.value)})}
              className="w-full px-4 py-4 rounded-xl border border-black/5 dark:border-white/10 bg-[#f4f4f5] dark:bg-[#111] text-zinc-900 dark:text-white focus:outline-none"
            />
          </div>
          <button type="submit" className="w-full bg-orange-500 text-black font-black uppercase tracking-widest py-4 rounded-xl mt-4 hover:bg-orange-600 transition-opacity flex justify-center">
            Save Rates
          </button>
        </form>
      </Modal>

      <Modal isOpen={!!costingOrder} onClose={() => setCostingOrder(null)} size="lg" title={`Costing: ${costingOrder?.orderNumber}`}>
        <form onSubmit={handleSaveCosting} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
             <div>
               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Powder (₹ computed via kg)</label>
               <input type="number" min="0" step="0.1" value={estimationData.powderKg || ''} onChange={e => setEstimationData({...estimationData, powderKg: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-black/5 dark:border-white/10 bg-[#f4f4f5] dark:bg-[#111] text-zinc-900 dark:text-white focus:outline-none" />
             </div>
             <div>
               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Material (kg)</label>
               <input type="number" min="0" step="0.1" value={estimationData.materialKg || ''} onChange={e => setEstimationData({...estimationData, materialKg: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-black/5 dark:border-white/10 bg-[#f4f4f5] dark:bg-[#111] text-zinc-900 dark:text-white focus:outline-none" />
             </div>
             <div>
               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Labour (₹)</label>
               <input type="number" min="0" step="0.1" value={estimationData.labourAllocation || ''} onChange={e => setEstimationData({...estimationData, labourAllocation: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-black/5 dark:border-white/10 bg-[#f4f4f5] dark:bg-[#111] text-zinc-900 dark:text-white focus:outline-none" />
             </div>
             <div>
               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Office Staff (₹)</label>
               <input type="number" min="0" step="0.1" value={estimationData.officeStaffAllocation || ''} onChange={e => setEstimationData({...estimationData, officeStaffAllocation: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-black/5 dark:border-white/10 bg-[#f4f4f5] dark:bg-[#111] text-zinc-900 dark:text-white focus:outline-none" />
             </div>
             <div>
               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Rent (₹)</label>
               <input type="number" min="0" step="0.1" value={estimationData.rentAllocation || ''} onChange={e => setEstimationData({...estimationData, rentAllocation: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-black/5 dark:border-white/10 bg-[#f4f4f5] dark:bg-[#111] text-zinc-900 dark:text-white focus:outline-none" />
             </div>
             <div>
               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Electricity Uses</label>
               <input type="number" min="0" step="0.1" value={estimationData.electricityUsage || ''} onChange={e => setEstimationData({...estimationData, electricityUsage: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-black/5 dark:border-white/10 bg-[#f4f4f5] dark:bg-[#111] text-zinc-900 dark:text-white focus:outline-none" />
             </div>
             <div>
               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Gas Uses</label>
               <input type="number" min="0" step="0.1" value={estimationData.gasUsage || ''} onChange={e => setEstimationData({...estimationData, gasUsage: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-black/5 dark:border-white/10 bg-[#f4f4f5] dark:bg-[#111] text-zinc-900 dark:text-white focus:outline-none" />
             </div>
             <div>
               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Transport (₹)</label>
               <input type="number" min="0" step="0.1" value={estimationData.transportCost || ''} onChange={e => setEstimationData({...estimationData, transportCost: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-black/5 dark:border-white/10 bg-[#f4f4f5] dark:bg-[#111] text-zinc-900 dark:text-white focus:outline-none" />
             </div>
             <div>
               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Misc (₹)</label>
               <input type="number" min="0" step="0.1" value={estimationData.miscCost || ''} onChange={e => setEstimationData({...estimationData, miscCost: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-black/5 dark:border-white/10 bg-[#f4f4f5] dark:bg-[#111] text-zinc-900 dark:text-white focus:outline-none" />
             </div>
          </div>
          
          <div className="bg-[#f4f4f5] dark:bg-[#111] p-5 rounded-2xl border border-black/5 dark:border-white/5 space-y-3">
             <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-2 mb-2">
               <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-white flex items-center">
                 <Calculator className="h-4 w-4 mr-2" /> Estimation
               </h3>
             </div>
             <div className="flex justify-between text-sm"><span className="text-zinc-500">Powder Rate</span><span className="font-bold text-zinc-900 dark:text-white">{estimationData.materialKg ? (estimationData.powderKg / estimationData.materialKg).toFixed(4) : 0}</span></div>
             <div className="flex justify-between text-sm"><span className="text-zinc-500">Electricity (₹{costSettings.electricityRate})</span><span className="font-bold text-zinc-900 dark:text-white">₹{((estimationData.electricityUsage || 0) * costSettings.electricityRate).toFixed(0)}</span></div>
             <div className="flex justify-between text-sm"><span className="text-zinc-500">Gas (₹{costSettings.gasRate})</span><span className="font-bold text-zinc-900 dark:text-white">₹{((estimationData.gasUsage || 0) * costSettings.gasRate).toFixed(0)}</span></div>
             <div className="flex justify-between text-sm"><span className="text-zinc-500">Process Charge</span><span className="font-bold text-zinc-900 dark:text-white">₹{((estimationData.materialKg || 0) * costSettings.processChargeRate).toFixed(0)}</span></div>
             <div className="flex justify-between text-sm"><span className="text-zinc-500">Revenue (Buyer Cost)</span><span className="font-bold text-emerald-500">₹{costingOrder?.totalValue.toLocaleString()}</span></div>
             
             <div className="pt-3 mt-2 border-t border-black/5 dark:border-white/5 flex justify-between items-end">
               <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Calculated Profit</span>
               <span className={`text-xl font-black ${((costingOrder?.totalValue || 0) - (Number(estimationData.labourAllocation) + Number(estimationData.officeStaffAllocation) + Number(estimationData.rentAllocation) + (estimationData.electricityUsage * costSettings.electricityRate) + (estimationData.gasUsage * costSettings.gasRate) + (estimationData.materialKg * costSettings.processChargeRate) + Number(estimationData.transportCost) + Number(estimationData.miscCost))) > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                 ₹{((costingOrder?.totalValue || 0) - (Number(estimationData.labourAllocation) + Number(estimationData.officeStaffAllocation) + Number(estimationData.rentAllocation) + (estimationData.electricityUsage * costSettings.electricityRate) + (estimationData.gasUsage * costSettings.gasRate) + (estimationData.materialKg * costSettings.processChargeRate) + Number(estimationData.transportCost) + Number(estimationData.miscCost))).toFixed(0)}
               </span>
             </div>
          </div>
          
          <button type="submit" className="w-full bg-orange-500 text-black font-black uppercase tracking-widest py-4 rounded-xl hover:bg-orange-600 transition-colors shadow-lg active:scale-[0.98]">
            Save Estimation
          </button>
        </form>
      </Modal>
    </div>
  );
}
