import React from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { mockCustomers } from '../store/mockData';
import { Building2, Phone, Mail, ChevronRight, Plus } from 'lucide-react';
import { cn } from '../lib/utils';

export default function CRM() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tight tracking-tight text-white">Customers</h1>
          <p className="text-zinc-500">Manage clients, view lifetime value, and communication history.</p>
        </div>
        <button className="inline-flex items-center justify-center rounded-none-none bg-orange-500 text-black border border-orange-500 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-black shadow-none hover:bg-orange-500/10 transition-colors">
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="relative w-full mb-6">
            <input
              type="text"
              placeholder="Search companies or contacts..."
              className="w-full px-4 py-3 border border-white/20 rounded-none-none focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm shadow-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockCustomers.map(customer => (
              <Card key={customer.id} className="hover:border-orange-500 transition-colors cursor-pointer group">
                <CardContent className="p-5 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-[#222] p-2.5 rounded-none-none group-hover:bg-orange-500/10 transition-colors">
                        <Building2 className="h-5 w-5 text-zinc-400 group-hover:text-orange-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white leading-tight">{customer.companyName}</h3>
                        <span className={cn(
                          "inline-block mt-1 px-2 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-wider",
                          customer.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 text-emerald-400' : 'bg-[#222] text-zinc-400'
                        )}>
                          {customer.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mt-auto pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                      <Mail className="h-4 w-4 text-zinc-600" />
                      {customer.email}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                      <Phone className="h-4 w-4 text-zinc-600" />
                      {customer.phone}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                    <div>
                      <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">Lifetime Value</div>
                      <div className="font-semibold text-white">${customer.lifetimeValue.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider text-right">Orders</div>
                      <div className="font-semibold text-white text-right">{customer.totalOrders}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Action Panel */}
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-brand-900 to-slate-900 text-white border-0">
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-2">Revenue Insights</h3>
              <p className="text-orange-500 text-sm mb-6">Top 3 customers account for 65% of total revenue this quarter.</p>
              
              <div className="space-y-4">
                <div className="flex justify-between items-end border-b border-white/10 pb-2">
                  <span className="text-sm font-medium text-orange-500">YTD Revenue</span>
                  <span className="text-xl font-bold tracking-tight">$124,500</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-sm font-medium text-orange-500">Active Pipeline</span>
                  <span className="text-xl font-bold tracking-tight">$18,200</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-white mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full flex items-center justify-between px-4 py-3 border border-white/20 rounded-none-none text-[10px] font-bold uppercase tracking-widest text-black hover:bg-black transition-colors">
                  Generate Client Report
                  <ChevronRight className="h-4 w-4 text-zinc-600" />
                </button>
                <button className="w-full flex items-center justify-between px-4 py-3 border border-white/20 rounded-none-none text-[10px] font-bold uppercase tracking-widest text-black hover:bg-black transition-colors">
                  Send Bulk Updates
                  <ChevronRight className="h-4 w-4 text-zinc-600" />
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
