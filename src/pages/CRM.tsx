import React, { useState } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { useDataStore } from '../store/data';
import { Building2, Phone, Mail, ChevronRight, Plus, Search, Trash2, Edit2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import Modal from '../components/ui/Modal';
import { Customer } from '../types';
import { motion } from 'motion/react';
import { SwipeAction } from '../components/ui/SwipeAction';

export default function CRM() {
  const [searchTerm, setSearchTerm] = useState('');
  const { customers, setCustomers, orders, addActivityLog } = useDataStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);
  const [newNote, setNewNote] = useState('');
  const [isBulkUpdateOpen, setIsBulkUpdateOpen] = useState(false);
  const [bulkMessage, setBulkMessage] = useState('');

  const ytdRevenue = orders.filter(o => o.status === 'Completed').reduce((sum, o) => sum + (o.totalValue || 0), 0);
  const activePipeline = orders.filter(o => o.status !== 'Completed').reduce((sum, o) => sum + (o.totalValue || 0), 0);

  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({
    companyName: '', email: '', phone: '', status: 'Active', lifetimeValue: 0, totalOrders: 0
  });

  const filteredCustomers = customers.filter(c => 
    c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.companyName || !newCustomer.email) {
      toast.error('Company Name and Email are required.');
      return;
    }
    const customer: Customer = {
      id: Math.random().toString(36).substr(2, 9),
      companyName: newCustomer.companyName!,
      email: newCustomer.email!,
      phone: newCustomer.phone || '',
      status: newCustomer.status as 'Active' | 'Inactive' | 'Lead' || 'Active',
      lifetimeValue: Number(newCustomer.lifetimeValue) || 0,
      totalOrders: Number(newCustomer.totalOrders) || 0,
      lastOrderDate: new Date().toISOString(),
      contactName: newCustomer.contactName || 'Primary Contact',
      communicationHistory: []
    };
    
    setCustomers(prev => [customer, ...prev]);
    addActivityLog({ action: 'create', module: 'CRM', details: `Added new customer: ${customer.companyName}`, userId: 'user1', userName: 'Admin' });
    setIsAddModalOpen(false);
    toast.success(`${customer.companyName} added to CRM`);
    setNewCustomer({ companyName: '', email: '', phone: '', status: 'Active', lifetimeValue: 0, totalOrders: 0 });
  };

  const handleSaveNote = () => {
    if (!activeCustomer || !newNote) return;
    setCustomers(prev => prev.map(c => 
      c.id === activeCustomer.id ? { 
        ...c, 
        communicationHistory: [{
          date: new Date().toISOString(), type: 'Email', summary: newNote
        }, ...(c.communicationHistory || [])]
      } : c
    ));
    setActiveCustomer(prev => prev ? {
      ...prev,
      communicationHistory: [{
          date: new Date().toISOString(), type: 'Email', summary: newNote
      }, ...(prev.communicationHistory || [])]
    } : null);
    setNewNote('');
    addActivityLog({ action: 'manage', module: 'CRM', details: `Added communication note for ${activeCustomer.companyName}`, userId: 'user1', userName: 'Admin' });
    toast.success('Communication logged');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-7xl mx-auto px-4 py-8 md:p-8"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 flex-shrink-0">
        <div>
          <label className="text-xs md:text-xs font-semibold text-orange-500">Network</label>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mt-1 text-zinc-900 dark:text-white">Customers</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2 font-medium text-sm">Manage clients, view lifetime value, and communication history.</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center bg-orange-600 px-5 py-2.5 rounded-lg text-sm font-medium text-white hover:bg-orange-700 transition-colors shadow-sm"
        >
          <Plus className="h-5 w-5 mr-2 stroke-[2.5]" />
          Add Customer
        </motion.button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          <Card className="bg-white/40 dark:bg-black/20 backdrop-blur-xl border-black/5 dark:border-white/5 rounded-[32px] shadow-sm shrink-0 mb-2">
            <CardContent className="p-5 md:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search companies or contacts..."
                  className="w-full pl-12 pr-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all font-medium placeholder:text-zinc-500 backdrop-blur-md"
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredCustomers.map((customer, index) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                key={customer.id} 
                className="w-full h-full"
              >
                <SwipeAction
                  className="rounded-[32px] w-full h-full"
                  bgClassName="rounded-[32px]"
                  rightActions={
                    <div className="flex items-center gap-2 pr-6 pl-2 h-full">
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          if(confirm('Delete this customer?')) {
                            setCustomers(customers.filter(c => c.id !== customer.id));
                          }
                        }} 
                        className="p-4 bg-rose-500/10 text-rose-600 rounded-2xl hover:bg-rose-500/20 transition-colors"
                      >
                        <Trash2 className="h-6 w-6" />
                      </button>
                    </div>
                  }
                  rightActionWidth={100}
                >
                  <div
                    onClick={() => setActiveCustomer(customer)}
                    className="bg-white/40 dark:bg-black/20 backdrop-blur-xl rounded-[32px] border border-black/5 dark:border-white/5 p-6 hover:border-orange-500/30 hover:shadow-xl transition-all cursor-pointer group flex flex-col relative overflow-hidden w-full h-full"
                  >
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-orange-400 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="flex items-start justify-between mb-6 relative z-10">
                      <div className="flex items-center gap-4">
                        <div className="bg-white/60 dark:bg-black/40 backdrop-blur-md rounded-xl border border-black/5 dark:border-white/5 w-12 h-12 flex items-center justify-center group-hover:bg-orange-500/10 group-hover:border-orange-500/30 transition-colors shrink-0">
                          <Building2 className="h-6 w-6 text-zinc-500 dark:text-zinc-400 group-hover:text-orange-500 transition-colors" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-zinc-900 dark:text-white leading-tight group-hover:text-orange-500 transition-colors text-lg">{customer.companyName}</h3>
                          <span className={cn(
                            "inline-block mt-1.5 px-3 py-1 rounded-md text-xs font-semibold border backdrop-blur-md",
                            customer.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-black/5 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 border-black/5 dark:border-white/10'
                          )}>
                            {customer.status}
                          </span>
                        </div>
                      </div>
                    </div>
    
                    <div className="space-y-4 mt-auto pt-5 border-t border-black/5 dark:border-white/5 relative z-10">
                      <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400 font-semibold truncate group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                        <Mail className="h-4 w-4 text-zinc-400 shrink-0 group-hover:text-orange-500 transition-colors" />
                        <span className="truncate">{customer.email}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400 font-semibold tracking-wide group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                        <Phone className="h-4 w-4 text-zinc-400 shrink-0 group-hover:text-orange-500 transition-colors" />
                        {customer.phone}
                      </div>
                    </div>
    
                    <div className="flex items-center justify-between mt-6 bg-white/60 dark:bg-black/40 backdrop-blur-md p-5 rounded-[20px] border border-black/5 dark:border-white/5 relative z-10">
                      <div>
                        <div className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] mb-1">Lifetime Value</div>
                        <div className="font-semibold text-zinc-900 dark:text-white text-xl">₹{customer.lifetimeValue.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] text-right mb-1">Orders</div>
                        <div className="font-semibold text-zinc-900 dark:text-white text-right text-xl">{customer.totalOrders}</div>
                      </div>
                    </div>
                  </div>
                </SwipeAction>
              </motion.div>
            ))}
          </div>
        </div>        {/* Action Panel */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-orange-500/10 to-[#111]/50 backdrop-blur-xl rounded-[32px] border border-orange-500/20 p-8 shadow-xl relative overflow-hidden group hover:border-orange-500/40 transition-colors">
            <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/20 blur-[60px] rounded-full group-hover:bg-orange-500/30 transition-colors"></div>
            <h3 className="font-semibold text-zinc-900 dark:text-white text-sm mb-3 relative z-10">Revenue Insights</h3>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-8 font-medium relative z-10">Top 3 customers account for <span className="text-orange-500 font-semibold">65%</span> of total revenue this quarter.</p>
            
            <div className="space-y-5 relative z-10">
              <div className="flex justify-between items-end border-b border-black/5 dark:border-white/5 pb-4">
                <span className="text-xs font-semibold text-zinc-500 text-zinc-500 dark:text-zinc-400">YTD Revenue</span>
                <span className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">₹{ytdRevenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-xs font-semibold text-zinc-500 text-zinc-500 dark:text-zinc-400">Active Pipeline</span>
                <span className="text-3xl font-semibold tracking-tight text-emerald-500">₹{activePipeline.toLocaleString()}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-[32px] p-6 shadow-2xl">
            <h3 className="font-semibold text-zinc-900 dark:text-white text-sm mb-6">Quick Actions</h3>
            <div className="space-y-4">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  const csvContent = 'data:text/csv;charset=utf-8,' 
                    + ['Company,Contact,Email,Phone,Status,Lifetime Value,Total Orders']
                      .concat(customers.map(c => `${c.companyName},${c.contactName},${c.email},${c.phone},${c.status},${c.lifetimeValue},${c.totalOrders}`))
                      .join('\n');
                  const encodedUri = encodeURI(csvContent);
                  const link = document.createElement("a");
                  link.setAttribute("href", encodedUri);
                  link.setAttribute("download", "client_report.csv");
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  toast.success('Client report downloaded.');
                }}
                className="w-full flex items-center justify-between px-6 py-5 rounded-xl bg-white/60 dark:bg-[#111] backdrop-blur-md border border-black/10 dark:border-white/10 text-xs font-semibold text-zinc-500 text-zinc-900 dark:text-white hover:border-orange-500/50 hover:bg-orange-500/10 hover:text-orange-500 transition-all active:scale-95 shadow-sm"
              >
                Generate Client Report
                <ChevronRight className="h-4 w-4" />
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsBulkUpdateOpen(true)}
                className="w-full flex items-center justify-between px-6 py-5 rounded-xl bg-white/60 dark:bg-[#111] backdrop-blur-md border border-black/10 dark:border-white/10 text-xs font-semibold text-zinc-500 text-zinc-900 dark:text-white hover:border-orange-500/50 hover:bg-orange-500/10 hover:text-orange-500 transition-all active:scale-95 shadow-sm"
              >
                Send Bulk Updates
                <ChevronRight className="h-4 w-4" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Customer">
        <form onSubmit={handleAddCustomer} className="space-y-6 p-2 md:p-6">
          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-2 px-1">Company Name</label>
            <input type="text" required value={newCustomer.companyName} onChange={e => setNewCustomer({...newCustomer, companyName: e.target.value})} className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-semibold shadow-sm placeholder:text-zinc-500" placeholder="e.g. Acme Corp" />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-2 px-1">Email Contact</label>
            <input type="email" required value={newCustomer.email} onChange={e => setNewCustomer({...newCustomer, email: e.target.value})} className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-semibold shadow-sm placeholder:text-zinc-500" placeholder="contact@acme.com" />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-2 px-1">Phone</label>
            <input type="tel" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-semibold shadow-sm placeholder:text-zinc-500" placeholder="(555) 123-4567" />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-2 px-1">Status</label>
            <select value={newCustomer.status} onChange={e => setNewCustomer({...newCustomer, status: e.target.value as any})} className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-semibold shadow-sm appearance-none cursor-pointer">
              <option>Active</option>
              <option>Lead</option>
              <option>Inactive</option>
            </select>
          </div>
          <button type="submit" className="w-full bg-orange-500 text-white font-semibold py-5 rounded-xl mt-8 hover:bg-orange-400 transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] active:scale-95 text-sm">
            Create Customer
          </button>
        </form>
      </Modal>

      <Modal size="lg" isOpen={!!activeCustomer} onClose={() => setActiveCustomer(null)} title={activeCustomer?.companyName || 'Customer Details'}>
        {activeCustomer && (
          <div className="space-y-6 p-2 md:p-6">
            <div className="flex gap-4 p-6 bg-white/60 dark:bg-[#111] backdrop-blur-md border border-black/10 dark:border-white/10 rounded-[24px] shadow-sm">
               <div className="flex-1">
                 <div className="text-xs text-zinc-500 font-semibold mb-1">Contact Email</div>
                 <div className="font-semibold text-sm text-zinc-900 dark:text-white">{activeCustomer.email}</div>
               </div>
               <div className="flex-1 border-l border-black/5 dark:border-white/5 pl-4">
                 <div className="text-xs text-zinc-500 font-semibold mb-1">Phone</div>
                 <div className="font-semibold text-sm text-zinc-900 dark:text-white">{activeCustomer.phone || '-'}</div>
               </div>
               <div className="flex-1 border-l border-black/5 dark:border-white/5 pl-4">
                 <div className="text-xs text-zinc-500 font-semibold mb-1">Total Orders</div>
                 <div className="font-semibold text-sm text-zinc-900 dark:text-white">{activeCustomer.totalOrders}</div>
               </div>
            </div>
            
            <div>
               <h3 className="text-xs font-semibold text-zinc-900 dark:text-white mb-4">Communication Logs</h3>
               <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                 {activeCustomer.communicationHistory?.length ? (
                   activeCustomer.communicationHistory.map((log, i) => (
                     <div key={i} className="bg-white/40 dark:bg-black/20 backdrop-blur-xl p-5 rounded-[20px] border border-black/5 dark:border-white/5 hover:border-orange-500/30 transition-colors shadow-sm">
                       <div className="flex justify-between items-center mb-3">
                         <span className="text-xs font-semibold bg-orange-500/10 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-md border border-orange-500/20 uppercase tracking-[0.1em]">{log.type}</span>
                         <span className="text-xs font-semibold text-zinc-500 tracking-[0.1em]">{new Date(log.date).toLocaleDateString()}</span>
                       </div>
                       <p className="text-sm text-zinc-800 dark:text-zinc-200 font-medium">{log.summary}</p>
                     </div>
                   ))
                 ) : (
                   <div className="p-8 text-center bg-black/[0.02] dark:bg-white/[0.02] border border-dashed border-black/10 dark:border-white/10 rounded-[20px]">
                     <p className="text-xs font-semibold text-zinc-500 text-zinc-500">No communication history</p>
                   </div>
                 )}
               </div>
            </div>

            <div className="pt-6 border-t border-black/5 dark:border-white/5">
               <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-3 px-1">Log New Communication</label>
               <div className="flex gap-3">
                 <input 
                   type="text" 
                   value={newNote}
                   onChange={e => setNewNote(e.target.value)}
                   className="flex-1 px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-medium text-sm placeholder:text-zinc-500 shadow-sm" 
                   placeholder="Note or outcome..." 
                   onKeyDown={e => e.key === 'Enter' && handleSaveNote()}
                 />
                 <button onClick={handleSaveNote} className="bg-orange-500 text-white px-6 py-4 rounded-xl font-semibold text-sm uppercase tracking-[0.1em] hover:bg-orange-400 active:scale-95 transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] whitespace-nowrap">
                   Save Note
                 </button>
               </div>
            </div>
          </div>
        )}
      </Modal>
      <Modal isOpen={isBulkUpdateOpen} onClose={() => setIsBulkUpdateOpen(false)} title="Bulk Broadcast">
        <div className="space-y-6 p-2 md:p-6">
          <p className="text-sm text-zinc-500 font-semibold">This message will be sent via Email to all <span className="font-semibold text-orange-600 dark:text-orange-400 px-2 py-1 bg-orange-500/10 rounded-md mx-1 border border-orange-500/20">{customers.length}</span> active customers.</p>
          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-2 px-1">Subject</label>
            <input 
              type="text" 
              placeholder="Important Update..."
              className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-medium text-sm placeholder:text-zinc-500 shadow-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-2 px-1">Message Body</label>
            <textarea 
              value={bulkMessage}
              onChange={e => setBulkMessage(e.target.value)}
              placeholder="Dear Customer..."
              className="w-full px-5 py-4 min-h-[150px] rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-medium text-sm placeholder:text-zinc-500 shadow-sm resize-none"
            />
          </div>
          <button 
            onClick={() => {
              if(!bulkMessage) return toast.error('Message body is empty.');
              addActivityLog({ action: 'manage', module: 'CRM', details: `Sent bulk broadcast to ${customers.length} customers.`, userId: 'user1', userName: 'Admin' });
              toast.success(`Broadcast successfully queued for ${customers.length} customers.`);
              setBulkMessage('');
              setIsBulkUpdateOpen(false);
            }} 
            className="w-full bg-orange-500 text-white py-5 rounded-xl mt-8 font-semibold text-sm uppercase tracking-[0.1em] hover:bg-orange-400 active:scale-95 transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)]"
          >
            Send Broadcast
          </button>
        </div>
      </Modal>
    </motion.div>
  );
}
