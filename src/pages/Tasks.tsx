import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { mockTasks, mockUsers } from '../store/mockData';
import { CheckCircle2, Clock, AlertCircle, Plus } from 'lucide-react';
import { cn } from '../lib/utils';

const priorityConfig = {
  High: 'text-rose-600 bg-rose-50 border-rose-200',
  Medium: 'text-amber-600 bg-amber-50 border-amber-200',
  Low: 'text-emerald-600 bg-emerald-50 border-emerald-200',
};

const statusConfig = {
  'To Do': { icon: Clock, className: 'text-zinc-500' },
  'In Progress': { icon: AlertCircle, className: 'text-orange-500' },
  'Done': { icon: CheckCircle2, className: 'text-emerald-500' },
};

export default function Tasks() {
  const columns = ['To Do', 'In Progress', 'Done'];

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-shrink-0">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tight tracking-tight text-white">Task Board</h1>
          <p className="text-zinc-500">Manage daily operational assignments and maintenance.</p>
        </div>
        <button className="inline-flex items-center justify-center rounded-none-none bg-orange-500 text-black border border-orange-500 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-black shadow-none hover:bg-orange-500/10 transition-colors">
          <Plus className="h-4 w-4 mr-2" />
          Assign Task
        </button>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-w-[768px]">
          {columns.map(status => (
            <div key={status} className="flex flex-col space-y-4">
              <div className="flex items-center justify-between border-b border-white/20 pb-2">
                <h3 className="font-semibold text-white">{status}</h3>
                <span className="bg-[#222] text-zinc-400 px-2.5 py-0.5 rounded-none-none text-xs font-medium">
                  {mockTasks.filter(t => t.status === status).length}
                </span>
              </div>
              
              <div className="flex flex-col gap-3">
                {mockTasks.filter(t => t.status === status).map(task => {
                  const assignee = mockUsers.find(u => u.id === task.assigneeId);
                  const Icon = statusConfig[task.status as keyof typeof statusConfig].icon;
                  
                  return (
                    <Card key={task.id} className="hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className={cn(
                            "px-2 py-0.5 rounded-none border text-[10px] font-bold uppercase tracking-wider",
                            priorityConfig[task.priority as keyof typeof priorityConfig]
                          )}>
                            {task.priority}
                          </span>
                          <Icon className={cn("h-4 w-4", statusConfig[task.status as keyof typeof statusConfig].className)} />
                        </div>
                        <h4 className="font-medium text-white mb-1 leading-tight">{task.title}</h4>
                        <p className="text-sm text-zinc-500 line-clamp-2 mb-4">{task.description}</p>
                        
                        <div className="flex items-center justify-between mt-auto">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-none-none bg-slate-800 flex items-center justify-center text-[10px] font-bold text-white" title={assignee?.name}>
                              {assignee?.name.charAt(0)}
                            </div>
                            <span className="text-xs text-zinc-400">{assignee?.name}</span>
                          </div>
                          <span className="text-xs text-zinc-600 font-medium">
                            {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
                {mockTasks.filter(t => t.status === status).length === 0 && (
                  <div className="border-2 border-dashed border-white/20 rounded-none-none p-8 flex flex-col items-center justify-center text-zinc-600 text-center">
                    <CheckCircle2 className="h-8 w-8 mb-2 opacity-20" />
                    <p className="text-sm font-medium">No tasks</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
