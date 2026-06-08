import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDataStore } from '../store/data';

export default function ExportInvoice() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { orders, costSettings } = useDataStore();
  
  const order = orders.find(o => o.id === orderId);
  const estimation = order?.costEstimation;

  useEffect(() => {
    // We removed the automatic print so user can manually trigger PDF generation
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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-[#111] min-h-screen text-[#1d1d1b] font-sans relative p-4 md:p-8">
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
          className="bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-orange-700 transition-colors flex items-center gap-2 shadow-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          Print to PDF
        </button>
      </div>

      <div className="flex justify-center w-full overflow-x-auto print:overflow-visible print:block pb-10 print:pb-0">
        <div className="w-[794px] min-h-[1123px] mx-auto bg-[#f0ece1] p-12 md:p-16 relative flex flex-col justify-between shadow-2xl shrink-0 print:shadow-none print:w-[100%] print:min-h-auto">
          <div className="flex-1">
           {/* Top Header */}
           <div className="flex justify-between items-start mb-20 text-[10px] md:text-xs font-bold uppercase tracking-widest leading-relaxed border-b-2 border-black pb-6">
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

           {/* Invoice Title & Meta */}
           <div className="grid grid-cols-4 gap-4 mb-20 w-full items-end">
              <div className="col-span-1">
                <div className="font-bold mb-1 uppercase tracking-widest text-[10px]">BILLED TO:</div>
                <div className="font-medium text-sm">{order.customerName}</div>
              </div>
              <div className="col-span-1">
                <div className="font-bold mb-1 uppercase tracking-widest text-[10px]">PAY TO:</div>
                <div className="font-medium text-sm leading-tight">Metamorph<br/>B-24, Atmiya 2 Ind. Park</div>
              </div>
              
              <div className="col-span-2 text-right">
                 <h1 className="text-[60px] font-black uppercase tracking-tighter leading-none text-zinc-900 mb-4">INVOICE</h1>
                 <div className="text-xs font-medium space-y-1">
                    <div>No.. {order.orderNumber}</div>
                    <div>{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                 </div>
              </div>
           </div>

           {/* Bank & Details */}
           <div className="mb-16 grid grid-cols-[100px_1fr] gap-2 text-xs font-medium">
              <div>Bank</div><div>HDFC Bank</div>
              <div>Account Name</div><div>Metamorph Metal</div>
              <div>IFSC</div><div>HDFC0001234</div>
              <div>Account Number</div><div>50200012345678</div>
           </div>

           {/* Table */}
           <div className="mb-20">
              <div className="grid grid-cols-4 border-b-2 border-black pb-4 mb-4 text-[10px] font-bold uppercase tracking-widest">
                 <div>DESCRIPTION</div>
                 <div className="text-right">RATE</div>
                 <div className="text-right">QTY/HRS</div>
                 <div className="text-right">AMOUNT</div>
              </div>
              
              <div className="space-y-4 text-sm font-medium">
                 <div className="grid grid-cols-4">
                    <div>Labour Allocation</div>
                    <div className="text-right">-</div>
                    <div className="text-right">-</div>
                    <div className="text-right">₹{Number(estimation.labourAllocation).toFixed(2)}</div>
                 </div>
                 <div className="grid grid-cols-4">
                    <div>Office Staff</div>
                    <div className="text-right">-</div>
                    <div className="text-right">-</div>
                    <div className="text-right">₹{Number(estimation.officeStaffAllocation).toFixed(2)}</div>
                 </div>
                 <div className="grid grid-cols-4">
                    <div>Rent/Overhead</div>
                    <div className="text-right">-</div>
                    <div className="text-right">-</div>
                    <div className="text-right">₹{Number(estimation.rentAllocation).toFixed(2)}</div>
                 </div>
                 <div className="grid grid-cols-4">
                    <div>Electricity</div>
                    <div className="text-right">₹{costSettings.electricityRate}/u</div>
                    <div className="text-right">{estimation.electricityUsage}</div>
                    <div className="text-right">₹{electricityCost.toFixed(2)}</div>
                 </div>
                 <div className="grid grid-cols-4">
                    <div>Gas</div>
                    <div className="text-right">₹{costSettings.gasRate}/u</div>
                    <div className="text-right">{estimation.gasUsage}</div>
                    <div className="text-right">₹{gasCost.toFixed(2)}</div>
                 </div>
                 <div className="grid grid-cols-4">
                    <div>Process Charge ({estimation.materialKg}kg material)</div>
                    <div className="text-right">₹{costSettings.processChargeRate}/kg</div>
                    <div className="text-right">{estimation.materialKg}</div>
                    <div className="text-right">₹{processCharge.toFixed(2)}</div>
                 </div>
                 <div className="grid grid-cols-4">
                    <div>Transport</div>
                    <div className="text-right">-</div>
                    <div className="text-right">-</div>
                    <div className="text-right">₹{Number(estimation.transportCost).toFixed(2)}</div>
                 </div>
                 <div className="grid grid-cols-4">
                    <div>Misc</div>
                    <div className="text-right">-</div>
                    <div className="text-right">-</div>
                    <div className="text-right">₹{Number(estimation.miscCost).toFixed(2)}</div>
                 </div>
              </div>

              <div className="mt-8 pt-4 border-t-2 border-black grid grid-cols-4 text-sm font-bold">
                 <div>Sub-Total Cost</div>
                 <div className="col-span-2"></div>
                 <div className="text-right tracking-tight">₹{totalCost.toFixed(2)}</div>
              </div>
              
              <div className="mt-4 pt-4 border-t-2 border-black grid grid-cols-4 text-sm font-black">
                 <div>TOTAL BUYER COST</div>
                 <div className="col-span-2"></div>
                 <div className="text-right text-emerald-600 tracking-tight">₹{order.totalValue.toFixed(2)}</div>
              </div>
              
              <div className="mt-4 pt-4 border-t-2 border-black grid grid-cols-4 text-sm font-black">
                 <div>ESTIMATED PROFIT</div>
                 <div className="col-span-2"></div>
                 <div className="text-right text-orange-600 tracking-tight">₹{profit.toFixed(2)}</div>
              </div>
           </div>
        </div>

         {/* Footer Graphic */}
         <div className="relative border-t-2 border-black pt-12 mt-12 overflow-hidden">
           <div className="text-[10px] font-bold uppercase tracking-widest leading-relaxed max-w-sm mb-12">
             Payment is required within 14 business days of invoice date.<br/>
             Please send remittance to sales@metamorphmetal.com
           </div>

           <div className="w-full flex justify-center opacity-[0.08] pointer-events-none -mb-16">
              <svg viewBox="0 0 1300 350" className="w-[110%] h-auto text-black" preserveAspectRatio="xMidYMid meet">
                 <text x="50%" y="54%" dominantBaseline="central" textAnchor="middle" fontSize="200" fontWeight="900" fontFamily="system-ui, sans-serif" fill="currentColor" letterSpacing="-0.02em">
                    METAMORPH
                 </text>
              </svg>
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
   </div>
  );
}
