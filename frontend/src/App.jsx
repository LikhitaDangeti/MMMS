import { useEffect, useState } from 'react';
import { api } from './api.js';
import EntryForm from './components/EntryForm.jsx';
import Dashboard from './components/Dashboard.jsx';
import HomePage from './components/HomePage.jsx';
import { Analytics } from './components/Analytics.jsx';
import { LayoutDashboard, FileEdit, ClipboardCheck, Moon, Sun, AlertTriangle, BarChart2, ClipboardList } from 'lucide-react';

export default function App() {
  const [tab, setTab] = useState('home');
  const [editContext, setEditContext] = useState(null);
  const [sheets, setSheets] = useState([]);
  const [err, setErr] = useState(null);
  
  // Dark mode logic
  const [isDark, setIsDark] = useState(() => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('mmms_theme') === 'dark';
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('mmms_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('mmms_theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    api.sheets().then(setSheets).catch(() => setErr('Cannot reach the API on port 4000. Is the backend running?'));
  }, []);

  if (tab === 'home') {
    return <HomePage onLaunch={() => setTab('entry')} />;
  }

  return (
    <div className="min-h-full font-sans transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100 pb-24">
      {/* Glassmorphic Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 shadow-glass dark:shadow-glass-dark">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand text-white shadow-md shadow-brand/20">
              <ClipboardCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="font-display text-[15px] font-bold leading-tight tracking-tight text-slate-900 dark:text-white">
                HSM Mill Shift Checklist
              </div>
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Ghost in the shell script
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            
            <nav className="flex gap-1 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 p-1 border border-slate-200/50 dark:border-slate-700/50 overflow-x-auto">
              <button 
                onClick={() => { setEditContext(null); setTab('entry'); }} 
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all ${tab === 'entry' ? 'bg-white dark:bg-slate-700 text-brand dark:text-brand-light shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}
              >
                <FileEdit className="h-4 w-4" /> <span className="hidden sm:inline">Entry</span>
              </button>
              <button 
                onClick={() => setTab('dashboard')} 
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all ${tab === 'dashboard' ? 'bg-white dark:bg-slate-700 text-brand dark:text-brand-light shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}
              >
                <ClipboardList className="h-4 w-4" /> <span className="hidden sm:inline">Submissions</span>
              </button>
              <button 
                onClick={() => { setEditContext(null); setTab('anomalies'); }} 
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all ${tab === 'anomalies' ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400'}`}
              >
                <AlertTriangle className="h-4 w-4" /> <span className="hidden sm:inline">Anomalies</span>
              </button>
              <button 
                onClick={() => { setEditContext(null); setTab('analytics'); }} 
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all ${tab === 'analytics' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400'}`}
              >
                <BarChart2 className="h-4 w-4" /> <span className="hidden sm:inline">Analytics</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-3 sm:px-6 py-6">
        {err && (
          <div className="mb-6 rounded-xl bg-red-50 dark:bg-red-500/10 p-4 border border-red-200 dark:border-red-500/20 text-sm text-red-800 dark:text-red-400 font-medium flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
            {err}
          </div>
        )}
        {sheets.length > 0 && (
          tab === 'entry' ? <EntryForm sheets={sheets} initialContext={editContext} /> : 
          tab === 'analytics' ? <Analytics sheets={sheets} /> :
          tab === 'anomalies' ? <Dashboard sheets={sheets} anomaliesOnly={true} onEdit={(ctx) => { setEditContext(ctx); setTab('entry'); }} /> :
          <Dashboard sheets={sheets} onEdit={(ctx) => { setEditContext(ctx); setTab('entry'); }} />
        )}
      </main>
    </div>
  );
}
