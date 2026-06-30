import React, { useState } from 'react';
import { useDataStore } from '../store/data';
import { Search, Plus, CheckSquare, Clock, AlertCircle, Trash2, Calendar, User, Edit2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { Task } from '../types';
import Modal from '../components/ui/Modal';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { SwipeAction } from '../components/ui/SwipeAction';

export default function Tasks() {
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'All' | 'High' | 'Medium' | 'Low'>('All');
  const { tasks, setTasks, users, roles } = useDataStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

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

  const handleOpenCreate = () => {
    setEditingTask(null);
    setNewTask({ title: '', description: '', status: 'To Do', priority: 'Medium', assigneeId: defaultUserId, dueDate: new Date().toISOString().split('T')[0] });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setNewTask(task);
    setIsModalOpen(true);
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title) {
      toast.error('Task title is required');
      return;
    }
    
    if (editingTask) {
      const updatedTasks = tasks.map(t => t.id === editingTask.id ? { ...newTask as Task } : t);
      setTasks(updatedTasks);
      toast.success('Task updated');
    } else {
      const task: Task = {
        id: Math.random().toString(36).substr(2, 9),
        title: newTask.title,
        description: newTask.description || '',
        assigneeId: newTask.assigneeId!,
        status: newTask.status as any || 'To Do',
        priority: newTask.priority as any || 'Medium',
        dueDate: newTask.dueDate || new Date().toISOString().split('T')[0]
      };
      setTasks([...tasks, task]);
      toast.success('Task created');
    }
    setIsModalOpen(false);
  };

  const handleDeleteTask = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setTasks(tasks.filter(t => t.id !== id));
    toast.success('Task deleted');
    if (editingTask?.id === id) setIsModalOpen(false);
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
      case 'In Progress': return <Clock className="h-4 w-4 text-amber-500" />;
      default: return <AlertCircle className="h-4 w-4 text-zinc-400" />;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full flex flex-col space-y-6 max-w-7xl mx-auto px-4 py-8 md:p-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 flex-shrink-0 mb-4">
        <div>
          <label className="text-xs md:text-xs font-semibold text-orange-500">Workspace</label>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mt-1 text-zinc-900 dark:text-white">Action Items</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2 font-medium text-sm">Track responsibilities, maintenance, and operational to-dos.</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center bg-orange-600 px-5 py-2.5 rounded-lg text-sm font-medium text-white hover:bg-orange-700 transition-colors shadow-sm active:scale-95"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </motion.button>
      </div>

      <div className="bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-[24px] shadow-sm shrink-0 mb-6 p-6">
          <div className="flex flex-col sm:flex-row gap-6 justify-between items-center">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-black/40 backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-medium placeholder:text-zinc-500"
              />
            </div>
            
            <div className="flex w-full sm:w-auto bg-white/60 dark:bg-black/40 backdrop-blur-md p-1.5 rounded-xl border border-black/10 dark:border-white/10 shadow-sm custom-scrollbar overflow-x-auto">
              {['All', 'High', 'Medium', 'Low'].map(p => (
                <button
                  key={p}
                  onClick={() => setPriorityFilter(p as any)}
                  className={cn(
                    "flex-1 sm:flex-none px-6 py-3 rounded-lg text-xs sm:text-xs font-semibold text-zinc-500 transition-all whitespace-nowrap border border-transparent",
                    priorityFilter === p 
                      ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white border-black/10 dark:border-white/10" 
                      : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
      </div>

      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
        <AnimatePresence mode="popLayout">
          {filteredTasks.map((task, index) => {
            const assignee = users.find(u => u.id === task.assigneeId);
            return (
              <motion.div 
                key={task.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
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
                          if(confirm('Delete this task?')) {
                            setTasks(tasks.filter(t => t.id !== task.id));
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
                    onClick={() => handleOpenEdit(task)}
                    className="bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-[32px] p-6 md:p-8 shadow-sm hover:shadow-xl hover:bg-white/60 dark:hover:bg-black/40 hover:border-orange-500/30 transition-all flex flex-col relative w-full h-full cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-6 md:mb-8">
                      <div className={cn("px-4 py-2 rounded-lg border text-xs font-semibold", getPriorityColor(task.priority))}>
                        {task.priority} Priority
                      </div>
                      <div className="flex items-center gap-2 bg-white/80 dark:bg-black/50 px-4 py-2 rounded-lg border border-black/5 dark:border-white/5 shadow-sm">
                        {getStatusIcon(task.status)}
                        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{task.status}</span>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white mb-3 leading-tight group-hover:text-orange-500 transition-colors">{task.title}</h3>
                    <p className="text-zinc-500 dark:text-zinc-400 font-medium text-sm mb-6 md:mb-8 flex-1 line-clamp-3 leading-relaxed">{task.description || 'No description provided.'}</p>
                    
                    <div className="mt-auto pt-6 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center font-semibold text-zinc-900 dark:text-white text-base md:text-lg border border-black/5 dark:border-white/5 shadow-sm">
                          {assignee?.name.charAt(0) || '?'}
                        </div>
                        <div>
                          <div className="font-semibold text-zinc-900 dark:text-white text-sm">{assignee?.name || 'Unassigned'}</div>
                          <div className="text-zinc-500 text-[10px] md:text-xs font-semibold flex items-center gap-1.5 mt-1">
                             <Calendar className="h-3.5 w-3.5" />
                             {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 relative z-10">
                        <select 
                          onClick={(e) => e.stopPropagation()}
                          value={task.status}
                          onChange={(e) => setTasks(tasks.map(t => t.id === task.id ? {...t, status: e.target.value as any} : t))}
                          className="bg-white/60 dark:bg-black/40 backdrop-blur-md border border-black/10 dark:border-white/10 rounded-lg text-zinc-900 dark:text-white text-xs font-semibold text-zinc-500 px-3 py-2 md:px-4 md:py-3 focus:outline-none focus:border-orange-500 appearance-none cursor-pointer transition-colors hover:bg-white dark:hover:bg-zinc-800"
                        >
                          <option value="To Do">To Do</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Done">Done</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </SwipeAction>
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {filteredTasks.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="col-span-full py-24 flex flex-col justify-center items-center text-center"
          >
            <div className="w-24 h-24 mb-6 rounded-[32px] bg-orange-500/10 text-orange-500 flex items-center justify-center border border-orange-500/20">
              <CheckSquare className="h-10 w-10" />
            </div>
            <h3 className="text-xl font-semibold uppercase tracking-tight text-zinc-900 dark:text-white mb-2">No Tasks Found</h3>
            <p className="text-zinc-500 max-w-md mx-auto">Adjust your search or filter priority to find what you're looking for.</p>
          </motion.div>
        )}
      </motion.div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTask ? "Edit Task" : "Create New Task"}>
        <form onSubmit={handleSaveTask} className="space-y-6">
          <div>
            <label className="text-xs font-semibold text-zinc-500 block mb-3 px-1">Task Title</label>
            <input 
              type="text" 
              required
              value={newTask.title}
              onChange={e => setNewTask({...newTask, title: e.target.value})}
              className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-black/40 backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-medium placeholder:text-zinc-500"
              placeholder="e.g. Inspect Conveyor Belt"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-500 block mb-3 px-1">Description</label>
            <textarea 
              value={newTask.description}
              onChange={e => setNewTask({...newTask, description: e.target.value})}
              className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-black/40 backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-medium placeholder:text-zinc-500 min-h-[140px] resize-none"
              placeholder="Details about the task..."
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-semibold text-zinc-500 block mb-3 px-1">Priority</label>
              <select 
                value={newTask.priority}
                onChange={e => setNewTask({...newTask, priority: e.target.value as any})}
                className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-black/40 backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors appearance-none font-medium cursor-pointer"
              >
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-500 block mb-3 px-1">Due Date</label>
              <input 
                type="date"
                required
                value={newTask.dueDate}
                onChange={e => setNewTask({...newTask, dueDate: e.target.value})}
                className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-black/40 backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-medium"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-500 block mb-3 px-1">Assignee</label>
            <div className="relative">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
              <select 
                value={newTask.assigneeId}
                onChange={e => setNewTask({...newTask, assigneeId: e.target.value})}
                className="w-full pl-12 pr-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-black/40 backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors appearance-none font-medium cursor-pointer"
              >
                {users.map(user => {
                  const roleName = roles.find(r => r.id === user.roleId)?.name || 'Unknown Role';
                  return (
                    <option key={user.id} value={user.id}>{user.name} ({roleName})</option>
                  );
                })}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-4 mt-10">
            <button 
              type="submit"
              className="w-full bg-orange-500 text-white font-semibold py-5 rounded-xl hover:bg-orange-600 transition-colors shadow-[0_0_20px_rgba(249,115,22,0.3)] active:scale-[0.98]"
            >
              {editingTask ? 'Save Changes' : 'Create Task'}
            </button>
            {editingTask && (
              <button 
                type="button"
                onClick={(e) => handleDeleteTask(e, editingTask.id)}
                className="w-full bg-rose-500/10 text-rose-600 dark:text-rose-500 font-semibold py-5 rounded-xl hover:bg-rose-500/20 transition-colors active:scale-95"
              >
                Delete Task
              </button>
            )}
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
