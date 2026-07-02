import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDataStore } from '../store/data';
import { useTheme } from '../store/theme';
import { Save, Moon, Sun, User, Building, Phone } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

export default function Settings() {
  const { currentUser } = useAuth();
  const { users, setUsers } = useDataStore();
  const { isDark, toggleTheme } = useTheme();

  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentUser) {
      const userProfile = users.find(u => u.id === currentUser.id);
      if (userProfile) {
        setName(userProfile.name || '');
        setDepartment(userProfile.department || '');
        setPhone(userProfile.phone || '');
      } else {
        setName(currentUser.name || '');
      }
    }
  }, [currentUser, users]);

  const handleSave = () => {
    if (!currentUser) return;
    setIsSaving(true);
    
    setTimeout(() => {
      setUsers(prev => {
        const userExists = prev.some(u => u.id === currentUser.id);
        if (userExists) {
          return prev.map(u => u.id === currentUser.id ? { ...u, name, department, phone } : u);
        } else {
          // Fallback if not found in users list yet
          return [...prev, {
            id: currentUser.id,
            name,
            email: currentUser.email,
            roleId: currentUser.roleId,
            status: 'Active',
            department,
            phone
          }];
        }
      });
      toast.success('Profile updated successfully');
      setIsSaving(false);
    }, 500);
  };

  return (
    <div className="h-full flex flex-col bg-transparent">
      <div className="px-8 py-6 pb-4">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">Settings</h1>
        <p className="text-zinc-500 mt-1">Manage your personal profile and app preferences.</p>
      </div>

      <div className="flex-1 overflow-y-auto px-8 pb-32 md:pb-12 space-y-8">
        
        {/* Profile Settings */}
        <section>
           <h2 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-white flex items-center gap-2">
             <User className="h-5 w-5 text-orange-500" />
             Profile Settings
           </h2>
           <div className="max-w-2xl bg-white dark:bg-[#111] p-6 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm space-y-6">
              
              <div>
                 <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 flex items-center gap-2">
                    <User className="h-4 w-4" /> Full Name
                 </label>
                 <input 
                   type="text" 
                   value={name} 
                   onChange={(e) => setName(e.target.value)}
                   className="w-full bg-black/5 dark:bg-white/5 border border-transparent focus:border-orange-500 focus:bg-white dark:focus:bg-black rounded-xl px-4 py-3 text-zinc-900 dark:text-white outline-none transition-all"
                   placeholder="Enter your full name"
                 />
              </div>

              <div>
                 <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 flex items-center gap-2">
                    <Building className="h-4 w-4" /> Department
                 </label>
                 <input 
                   type="text" 
                   value={department} 
                   onChange={(e) => setDepartment(e.target.value)}
                   className="w-full bg-black/5 dark:bg-white/5 border border-transparent focus:border-orange-500 focus:bg-white dark:focus:bg-black rounded-xl px-4 py-3 text-zinc-900 dark:text-white outline-none transition-all"
                   placeholder="E.g., Manufacturing, Operations..."
                 />
              </div>

              <div>
                 <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 flex items-center gap-2">
                    <Phone className="h-4 w-4" /> Phone Number
                 </label>
                 <input 
                   type="text" 
                   value={phone} 
                   onChange={(e) => setPhone(e.target.value)}
                   className="w-full bg-black/5 dark:bg-white/5 border border-transparent focus:border-orange-500 focus:bg-white dark:focus:bg-black rounded-xl px-4 py-3 text-zinc-900 dark:text-white outline-none transition-all"
                   placeholder="Enter your phone number"
                 />
              </div>

              <div className="pt-2">
                 <button 
                   onClick={handleSave}
                   disabled={isSaving}
                   className="flex items-center justify-center gap-2 w-full md:w-auto px-8 py-3 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-semibold rounded-xl transition-all shadow-lg shadow-orange-500/20 disabled:opacity-70"
                 >
                   {isSaving ? (
                     <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                   ) : (
                     <>
                        <Save className="h-5 w-5" />
                        Save Changes
                     </>
                   )}
                 </button>
              </div>
           </div>
        </section>

        {/* App Preferences */}
        <section>
           <h2 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-white flex items-center gap-2">
             <Moon className="h-5 w-5 text-orange-500" />
             App Preferences
           </h2>
           <div className="max-w-2xl bg-white dark:bg-[#111] p-6 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm space-y-6">
              
              <div className="flex items-center justify-between">
                 <div>
                    <h3 className="font-medium text-zinc-900 dark:text-white">Dark Mode</h3>
                    <p className="text-sm text-zinc-500">Toggle dark mode appearance for the app.</p>
                 </div>
                 <button 
                   onClick={toggleTheme}
                   className="h-14 w-14 rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center transition-colors"
                 >
                   {isDark ? <Sun className="h-6 w-6 text-white" /> : <Moon className="h-6 w-6 text-zinc-900" />}
                 </button>
              </div>

           </div>
        </section>

      </div>
    </div>
  );
}
