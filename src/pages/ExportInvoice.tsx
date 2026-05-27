import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDataStore } from '../store/data';

export default function ExportInvoice() {
  const { orderId } = useParams();
  const { orders, costSettings } = useDataStore();
  
  const order = orders.find(o => o.id === orderId);
  const estimation = order?.costEstimation;

  useEffect(() => {
    // Optional: automatically prompt print when loaded
    // setTimeout(() => window.print(), 500);
  }, []);

  if (!order || !estimation) {
    return <div className="p-10 font-bold">Invoice data not found for this order. Please save an estimation first.</div>;
  }

  const powderRate = estimation.materialKg ? estimation.powderKg / estimation.materialKg : 0;
  const electricityCost = estimation.electricityUsage * costSettings.electricityRate;
  const gasCost = estimation.gasUsage * costSettings.gasRate;
  const processCharge = estimation.materialKg * costSettings.processChargeRate;
  
  const totalCost = Number(estimation.labourAllocation) + 
                    Number(estimation.officeStaffAllocation) + 
                    Number(estimation.rentAllocation) + 
                    electricityCost + gasCost + processCharge + 
                    Number(estimation.transportCost) + 
                    Number(estimation.miscCost);
                    
  const profit = order.totalValue - totalCost;

  return (
    <div className="bg-[#f0ece1] min-h-screen text-[#1d1d1b] font-sans p-8 md:p-16 flex justify-center">
      <div className="w-full max-w-4xl bg-[#f0ece1] shadow-2xl p-10 md:p-16 relative overflow-hidden print:shadow-none print:p-0">
        
        {/* Top Header */}
        <div className="flex justify-between items-start mb-20 text-[10px] md:text-xs font-bold uppercase tracking-widest leading-relaxed">
          <div>(METAMORPHMETALS.COM)</div>
          <div className="text-right">
             +91 98765 43210<br/>
             metamorphmetals.com
          </div>
          <div className="text-right">
             123 Industrial Area, Phase 1<br/>
             Gujarat, India
          </div>
        </div>

        {/* Invoice Title & Meta */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20">
           <div className="col-span-2 md:col-span-1">
             <div className="font-bold mb-1 uppercase tracking-widest text-[10px]">BILLED TO:</div>
             <div className="font-medium text-sm">{order.customerName}</div>
           </div>
           <div className="col-span-2 md:col-span-1">
             <div className="font-bold mb-1 uppercase tracking-widest text-[10px]">PAY TO:</div>
             <div className="font-medium text-sm">Metamorph Metals<br/>123 Industrial Area, Gujarat</div>
           </div>
           
           <div className="col-span-2 md:col-span-2 flex justify-between items-end flex-col">
              <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-zinc-900 mb-2">PROFORMA INVOICE</h1>
              <div className="text-right text-xs font-medium space-y-1">
                 <div>No.. {order.orderNumber}</div>
                 <div>{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
              </div>
           </div>
        </div>

        {/* Bank & Details */}
        <div className="mb-16 grid grid-cols-[100px_1fr] gap-2 text-xs font-medium">
           <div>Bank</div><div>HDFC Bank</div>
           <div>Account Name</div><div>Metamorph Metals</div>
           <div>IFSC</div><div>HDFC0001234</div>
           <div>Account Number</div><div>50200012345678</div>
        </div>

        {/* Table */}
        <div className="mb-20">
           <div className="grid grid-cols-4 md:grid-cols-[2fr_1fr_1fr_1fr] border-b border-black pb-4 mb-4 text-[10px] font-bold uppercase tracking-widest">
              <div>DESCRIPTION</div>
              <div className="text-right">RATE</div>
              <div className="text-right">QTY/HRS</div>
              <div className="text-right">AMOUNT</div>
           </div>
           
           <div className="space-y-4 text-sm font-medium">
              <div className="grid grid-cols-4 md:grid-cols-[2fr_1fr_1fr_1fr]">
                 <div>Labour Allocation</div>
                 <div className="text-right">-</div>
                 <div className="text-right">-</div>
                 <div className="text-right">₹{Number(estimation.labourAllocation).toFixed(2)}</div>
              </div>
              <div className="grid grid-cols-4 md:grid-cols-[2fr_1fr_1fr_1fr]">
                 <div>Office Staff</div>
                 <div className="text-right">-</div>
                 <div className="text-right">-</div>
                 <div className="text-right">₹{Number(estimation.officeStaffAllocation).toFixed(2)}</div>
              </div>
              <div className="grid grid-cols-4 md:grid-cols-[2fr_1fr_1fr_1fr]">
                 <div>Rent/Overhead</div>
                 <div className="text-right">-</div>
                 <div className="text-right">-</div>
                 <div className="text-right">₹{Number(estimation.rentAllocation).toFixed(2)}</div>
              </div>
              <div className="grid grid-cols-4 md:grid-cols-[2fr_1fr_1fr_1fr]">
                 <div>Electricity</div>
                 <div className="text-right">₹{costSettings.electricityRate}/u</div>
                 <div className="text-right">{estimation.electricityUsage}</div>
                 <div className="text-right">₹{electricityCost.toFixed(2)}</div>
              </div>
              <div className="grid grid-cols-4 md:grid-cols-[2fr_1fr_1fr_1fr]">
                 <div>Gas</div>
                 <div className="text-right">₹{costSettings.gasRate}/u</div>
                 <div className="text-right">{estimation.gasUsage}</div>
                 <div className="text-right">₹{gasCost.toFixed(2)}</div>
              </div>
              <div className="grid grid-cols-4 md:grid-cols-[2fr_1fr_1fr_1fr]">
                 <div>Process Charge ({estimation.materialKg}kg material)</div>
                 <div className="text-right">₹{costSettings.processChargeRate}/kg</div>
                 <div className="text-right">{estimation.materialKg}</div>
                 <div className="text-right">₹{processCharge.toFixed(2)}</div>
              </div>
              <div className="grid grid-cols-4 md:grid-cols-[2fr_1fr_1fr_1fr]">
                 <div>Transport</div>
                 <div className="text-right">-</div>
                 <div className="text-right">-</div>
                 <div className="text-right">₹{Number(estimation.transportCost).toFixed(2)}</div>
              </div>
              <div className="grid grid-cols-4 md:grid-cols-[2fr_1fr_1fr_1fr]">
                 <div>Misc</div>
                 <div className="text-right">-</div>
                 <div className="text-right">-</div>
                 <div className="text-right">₹{Number(estimation.miscCost).toFixed(2)}</div>
              </div>
           </div>

           <div className="mt-8 pt-4 border-t border-black grid grid-cols-4 md:grid-cols-[2fr_1fr_1fr_1fr] text-sm font-bold">
              <div>Sub-Total Cost</div>
              <div className="col-span-2"></div>
              <div className="text-right">₹{totalCost.toFixed(2)}</div>
           </div>
           
           <div className="mt-4 pt-4 border-t border-black grid grid-cols-4 md:grid-cols-[2fr_1fr_1fr_1fr] text-sm font-bold">
              <div>TOTAL BUYER COST</div>
              <div className="col-span-2"></div>
              <div className="text-right text-emerald-600">₹{order.totalValue.toFixed(2)}</div>
           </div>
           
           <div className="mt-4 pt-4 border-t border-black grid grid-cols-4 md:grid-cols-[2fr_1fr_1fr_1fr] text-sm font-black">
              <div>ESTIMATED PROFIT</div>
              <div className="col-span-2"></div>
              <div className="text-right text-orange-600">₹{profit.toFixed(2)}</div>
           </div>
        </div>

        {/* Footer */}
        <div className="text-[10px] font-bold uppercase tracking-widest leading-relaxed max-w-sm mb-32">
          Payment is required within 14 business days of invoice date.<br/>
          Please send remittance to billing@metamorphmetals.com
        </div>

        <div className="absolute bottom-0 left-0 w-full flex justify-center translate-y-1/4 opacity-10 pointer-events-none">
          <h1 className="text-[8rem] md:text-[12rem] font-black tracking-tighter text-black select-none uppercase">Metamorph</h1>
        </div>
        
      </div>
      
      <div className="fixed bottom-8 right-8 print:hidden flex gap-4">
         <button onClick={() => window.close()} className="px-6 py-3 bg-white text-black font-bold text-sm tracking-widest uppercase rounded-full shadow-xl hover:bg-zinc-100">Close</button>
         <button onClick={() => window.print()} className="px-6 py-3 bg-orange-600 text-white font-bold text-sm tracking-widest uppercase rounded-full shadow-xl hover:bg-orange-700">Print / PDF</button>
      </div>
    </div>
  );
}
