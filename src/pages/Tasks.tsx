import React, { useState } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { useDataStore } from '../store/data';
import { Search, Plus, Filter, CheckSquare, Clock, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { Task } from '../types';
import Modal from '../components/ui/Modal';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

export default function Tasks() {
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'All' | 'High' | 'Medium' | 'Low'>('All');
  const { tasks, setTasks, users, roles } = useDataStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // default user ID fallback if users list is empty
  const defaultUserId = users.length > 0 ? users[0].id : '';

  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    status: 'To Do',
    priority: 'Medium',
    assigneeId: defaultUserId,
    dueDate: new Date().toISOString().split('T')[0]
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title) {
      toast.error('Task title is required');
      return;
    }
    
    const task: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title: newTask.title,
      description: newTask.description || '',
      assigneeId: newTask.assigneeId!,
      status: 'To Do',
      priority: newTask.priority as any || 'Medium',
      dueDate: newTask.dueDate || new Date().toISOString().split('T')[0]
    };

    setTasks([...tasks, task]);
    setIsCreateModalOpen(false);
    toast.success(`Task created`);
    setNewTask({ title: '', description: '', status: 'To Do', priority: 'Medium', assigneeId: defaultUserId, dueDate: new Date().toISOString().split('T')[0] });
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = priorityFilter === 'All' || task.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      case 'Medium': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'Low': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      default: return 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'Done': return <CheckSquare className="h-4 w-4 text-emerald-500" />;
      case 'In Progress': return <Clock className="h-4 w-4 text-orange-500" />;
      default: return <AlertCircle className="h-4 w-4 text-zinc-500" />;
    }
  };

  return (
    <div className="h-full flex flex-col space-y-4 md:space-y-6 max-w-7xl mx-auto px-4 py-8 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 flex-shrink-0">
        <div>
          <label className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-orange-500">Task Management</label>
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight mt-1 text-zinc-900 dark:text-white">Action Items</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2 font-medium text-sm">Track responsibilities, maintenance, and operational to-dos.</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center justify-center bg-orange-500 px-6 py-3 md:py-4 rounded-xl text-sm font-black uppercase tracking-widest text-black hover:bg-orange-600 transition-colors shadow-lg active:scale-95"
        >
          <Plus className="h-5 w-5 mr-2" />
          New Task
        </button>
      </div>

      <div className="flex-shrink-0 flex flex-col sm:flex-row gap-4 mb-4">
         <div className="relative w-full sm:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-xl border border-black/5 dark:border-white/10 bg-[#f4f4f5] dark:bg-[#111] text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors placeholder:text-zinc-600 font-medium"
            />
          </div>
          
          <div className="flex bg-[#f4f4f5] dark:bg-[#111] p-1 rounded-xl border border-black/5 dark:border-white/10 w-full sm:w-auto overflow-x-auto">
            {['All', 'High', 'Medium', 'Low'].map(p => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p as any)}
                className={cn(
                  "flex-1 sm:flex-none px-6 py-3 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest transition-colors",
                  priorityFilter === p 
                    ? "bg-white text-black shadow-sm" 
                    : "text-zinc-500 hover:text-zinc-900 dark:text-white hover:bg-black/5 dark:bg-white/5"
                )}
              >
                {p}
              </button>
            ))}
          </div>
      </div>

      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 pb-6">
        <AnimatePresence mode="popLayout">
          {filteredTasks.map(task => {
            const assignee = users.find(u => u.id === task.assigneeId);
            return (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.9, filter: "blur(4px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.9, filter: "blur(4px)" }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                whileHover={{ y: -4, scale: 1.01 }}
                key={task.id} 
                className="bg-[#f4f4f5] dark:bg-[#111] border border-black/5 dark:border-white/5 rounded-2xl p-5 shadow-sm hover:shadow-xl transition-shadow flex flex-col"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={cn("px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest", getPriorityColor(task.priority))}>
                    {task.priority} Priority
                  </div>
                  <div className="flex items-center gap-1.5 bg-white dark:bg-black px-3 py-1.5 rounded-lg border border-black/5 dark:border-white/5">
                    {getStatusIcon(task.status)}
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">{task.status}</span>
                  </div>
                </div>
                
                <h3 className="text-lg font-black text-zinc-900 dark:text-white mb-2 leading-tight">{task.title}</h3>
                <p className="text-zinc-600 dark:text-zinc-400 font-medium text-sm mb-6 flex-1">{task.description}</p>
                
                <div className="mt-auto pt-4 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center font-black text-zinc-900 dark:text-white text-xs">
                      {assignee?.name.charAt(0) || '?'}
                    </div>
                    <div>
                      <div className="font-bold text-zinc-900 dark:text-white uppercase text-[10px] tracking-widest">{assignee?.name || 'Unassigned'}</div>
                      <div className="text-zinc-500 text-[10px] font-bold tracking-widest">
                         Due: {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}
                      </div>
                    </div>
                  </div>
                  
                  <select 
                    value={task.status}
                    onChange={(e) => setTasks(tasks.map(t => t.id === task.id ? {...t, status: e.target.value as any} : t))}
                    className="bg-white dark:bg-black border border-black/5 dark:border-white/10 rounded-lg text-zinc-900 dark:text-white text-[10px] font-bold uppercase tracking-widest p-2 focus:outline-none focus:border-orange-500 appearance-none"
                  >
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {filteredTasks.length === 0 && (
          <div className="col-span-full py-12 flex flex-col justify-center items-center text-zinc-500 border border-dashed border-black/5 dark:border-white/5 rounded-2xl">
            <CheckSquare className="h-12 w-12 mb-4 text-zinc-800" />
            <h3 className="text-sm font-black uppercase tracking-widest">No Tasks Found</h3>
            <p className="text-xs font-medium mt-2">Adjust your search or filter priority.</p>
          </div>
        )}
      </motion.div>

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New Task">
        <form onSubmit={handleCreateTask} className="space-y-5">
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Task Title</label>
            <input 
              type="text" 
              required
              value={newTask.title}
              onChange={e => setNewTask({...newTask, title: e.target.value})}
              className="w-full px-4 py-4 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-black text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-medium placeholder:text-zinc-600"
              placeholder="e.g. Inspect Conveyor Belt"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Description</label>
            <textarea 
              value={newTask.description}
              onChange={e => setNewTask({...newTask, description: e.target.value})}
              className="w-full px-4 py-4 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-black text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-medium placeholder:text-zinc-600 min-h-[100px] resize-none"
              placeholder="Details about the task..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Priority</label>
              <select 
                value={newTask.priority}
                onChange={e => setNewTask({...newTask, priority: e.target.value as any})}
                className="w-full px-4 py-4 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-black text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors appearance-none font-medium"
              >
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Due Date</label>
              <input 
                type="date"
                required
                value={newTask.dueDate}
                onChange={e => setNewTask({...newTask, dueDate: e.target.value})}
                className="w-full px-4 py-4 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-black text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-medium"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Assignee</label>
            <select 
              value={newTask.assigneeId}
              onChange={e => setNewTask({...newTask, assigneeId: e.target.value})}
              className="w-full px-4 py-4 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-black text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors appearance-none font-medium"
            >
              {users.map(user => {
                const roleName = roles.find(r => r.id === user.roleId)?.name || 'Unknown Role';
                return (
                  <option key={user.id} value={user.id}>{user.name} ({roleName})</option>
                );
              })}
            </select>
          </div>
          <button 
            type="submit"
            className="w-full bg-orange-500 text-black font-black uppercase tracking-widest py-4 rounded-xl mt-4 hover:bg-orange-600 transition-colors shadow-lg active:scale-[0.98]"
          >
            Create Task
          </button>
        </form>
      </Modal>
    </div>
  );
}
