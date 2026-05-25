import React, { useState } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { useDataStore } from '../store/data';
import { Building2, Phone, Mail, ChevronRight, Plus, Search } from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import Modal from '../components/ui/Modal';
import { Customer } from '../types';

export default function CRM() {
  const [searchTerm, setSearchTerm] = useState('');
  const { customers, setCustomers } = useDataStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
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
      contactName: newCustomer.contactName || 'Primary Contact'
    };
    
    setCustomers([customer, ...customers]);
    setIsAddModalOpen(false);
    toast.success(`${customer.companyName} added to CRM`);
    setNewCustomer({ companyName: '', email: '', phone: '', status: 'Active', lifetimeValue: 0, totalOrders: 0 });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-8 md:p-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 flex-shrink-0">
        <div>
          <label className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-orange-500">Network</label>
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight mt-1 text-zinc-900 dark:text-white">Customers</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2 font-medium text-sm">Manage clients, view lifetime value, and communication history.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center bg-orange-500 px-6 py-3 md:py-4 rounded-xl text-sm font-black uppercase tracking-widest text-black hover:bg-orange-600 transition-colors shadow-lg active:scale-95"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Customer
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search companies or contacts..."
              className="w-full pl-12 pr-4 py-4 rounded-xl border border-black/5 dark:border-white/10 bg-[#f4f4f5] dark:bg-[#111] text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors placeholder:text-zinc-600 font-medium"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCustomers.map(customer => (
              <div 
                key={customer.id} 
                onClick={() => toast.info(`Viewing details for ${customer.companyName}`)}
                className="bg-[#f4f4f5] dark:bg-[#111] rounded-2xl border border-black/5 dark:border-white/5 p-5 hover:border-orange-500/50 transition-colors cursor-pointer group flex flex-col shadow-lg"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-white dark:bg-black rounded-xl border border-black/5 dark:border-white/10 p-3 flex items-center justify-center group-hover:border-orange-500/30 transition-colors">
                      <Building2 className="h-5 w-5 text-zinc-600 dark:text-zinc-400 group-hover:text-orange-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-zinc-900 dark:text-white leading-tight">{customer.companyName}</h3>
                      <span className={cn(
                        "inline-block mt-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border",
                        customer.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-black/5 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 border-black/5 dark:border-white/10'
                      )}>
                        {customer.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mt-auto pt-4 border-t border-black/5 dark:border-white/5">
                  <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 font-medium truncate">
                    <Mail className="h-4 w-4 text-zinc-600 shrink-0" />
                    <span className="truncate">{customer.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 font-medium tracking-wide">
                    <Phone className="h-4 w-4 text-zinc-600 shrink-0" />
                    {customer.phone}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-5 bg-white dark:bg-black/50 p-4 rounded-xl border border-black/5 dark:border-white/5">
                  <div>
                    <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1 mt-0">Lifetime Value</div>
                    <div className="font-black text-zinc-900 dark:text-white text-lg">${customer.lifetimeValue.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest text-right mb-1 mt-0">Orders</div>
                    <div className="font-black text-zinc-900 dark:text-white text-right text-lg">{customer.totalOrders}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Panel */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-orange-500/10 to-[#111] rounded-2xl border border-orange-500/20 p-6 shadow-xl">
            <h3 className="font-bold uppercase tracking-widest text-zinc-900 dark:text-white text-xs mb-2">Revenue Insights</h3>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-6 font-medium">Top 3 customers account for <span className="text-orange-500 font-bold">65%</span> of total revenue this quarter.</p>
            
            <div className="space-y-4">
              <div className="flex justify-between items-end border-b border-black/5 dark:border-white/5 pb-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">YTD Revenue</span>
                <span className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">$124,500</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Active Pipeline</span>
                <span className="text-2xl font-black tracking-tight text-emerald-400">$18,200</span>
              </div>
            </div>
          </div>
          
          <div className="bg-[#f4f4f5] dark:bg-[#111] border border-black/5 dark:border-white/5 rounded-2xl p-6 shadow-xl">
            <h3 className="font-bold uppercase tracking-widest text-zinc-900 dark:text-white text-xs mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button 
                onClick={() => toast.success('Report generation started.')}
                className="w-full flex items-center justify-between px-4 py-4 rounded-xl bg-white dark:bg-black border border-black/5 dark:border-white/10 text-[10px] font-bold uppercase tracking-widest text-zinc-900 dark:text-white hover:border-orange-500 transition-colors active:scale-[0.98]"
              >
                Generate Client Report
                <ChevronRight className="h-4 w-4 text-zinc-500" />
              </button>
              <button 
                onClick={() => toast.success('Bulk update interface opened.')}
                className="w-full flex items-center justify-between px-4 py-4 rounded-xl bg-white dark:bg-black border border-black/5 dark:border-white/10 text-[10px] font-bold uppercase tracking-widest text-zinc-900 dark:text-white hover:border-orange-500 transition-colors active:scale-[0.98]"
              >
                Send Bulk Updates
                <ChevronRight className="h-4 w-4 text-zinc-500" />
              </button>
            </div>
          </div>
        </div>
      </div>
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Customer">
        <form onSubmit={handleAddCustomer} className="space-y-5">
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Company Name</label>
            <input type="text" required value={newCustomer.companyName} onChange={e => setNewCustomer({...newCustomer, companyName: e.target.value})} className="w-full px-4 py-4 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-black text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-medium placeholder:text-zinc-600" placeholder="e.g. Acme Corp" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Email Contact</label>
            <input type="email" required value={newCustomer.email} onChange={e => setNewCustomer({...newCustomer, email: e.target.value})} className="w-full px-4 py-4 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-black text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-medium placeholder:text-zinc-600" placeholder="contact@acme.com" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Phone</label>
            <input type="tel" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} className="w-full px-4 py-4 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-black text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-medium placeholder:text-zinc-600" placeholder="(555) 123-4567" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Status</label>
            <select value={newCustomer.status} onChange={e => setNewCustomer({...newCustomer, status: e.target.value as any})} className="w-full px-4 py-4 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-black text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors appearance-none font-medium">
              <option>Active</option>
              <option>Lead</option>
              <option>Inactive</option>
            </select>
          </div>
          <button type="submit" className="w-full bg-orange-500 text-black font-black uppercase tracking-widest py-4 rounded-xl mt-4 hover:bg-orange-600 transition-colors shadow-lg active:scale-[0.98]">
            Create Customer
          </button>
        </form>
      </Modal>

    </div>
  );
}
