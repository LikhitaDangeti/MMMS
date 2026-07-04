import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ZoomIn, ZoomOut, Download, FileX, Calendar, Clock, User, ChevronRight, Search, FileEdit, Trash2, AlertTriangle } from 'lucide-react';
import { api } from '../api.js';
import SheetGrid from '../SheetGrid.jsx';

const inputCls = "w-full rounded-xl border-[1.5px] border-slate-300 bg-white px-4 py-3 text-[14px] font-medium focus:border-brand focus:ring-1 focus:ring-brand outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-brand transition-all";
const labelCls = "block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 ml-1";

function ZoomBar({ zoom, setZoom }) {
  return (
    <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
      <button className="grid h-8 w-8 place-items-center rounded-lg bg-white dark:bg-slate-900 shadow-sm text-slate-600 dark:text-slate-300 hover:text-brand transition-colors" onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2)))}><ZoomOut className="w-4 h-4" /></button>
      <span className="w-12 text-center text-[12px] font-bold tabular-nums text-slate-700 dark:text-slate-300">{Math.round(zoom * 100)}%</span>
      <button className="grid h-8 w-8 place-items-center rounded-lg bg-white dark:bg-slate-900 shadow-sm text-slate-600 dark:text-slate-300 hover:text-brand transition-colors" onClick={() => setZoom((z) => Math.min(1.6, +(z + 0.1).toFixed(2)))}><ZoomIn className="w-4 h-4" /></button>
    </div>
  );
}

export default function Dashboard({ sheets, onEdit, anomaliesOnly }) {
  const [fSheet, setFSheet] = useState('');
  const [fDate, setFDate] = useState('');
  const [fName, setFName] = useState('');
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(null);
  const [zoom, setZoom] = useState(1);

  async function refresh() { setRows(await api.list({ sheetId: fSheet, date: fDate })); }
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [fSheet, fDate]);

  async function view(r) {
    const [layout, sub] = await Promise.all([api.layout(r.sheetId), api.get(r.date, r.shift, r.sheetId)]);
    setOpen({ layout, sub });
  }

  async function handleDelete(e, r) {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this submission?')) return;
    try {
      await api.remove(r.date, r.shift, r.sheetId);
      refresh();
    } catch (err) {
      alert('Failed to delete');
    }
  }

  function handleEdit(e, r) {
    e.stopPropagation();
    if (onEdit) onEdit({ date: r.date, shift: r.shift, sheetId: r.sheetId });
  }

  const filteredRows = rows.filter(r => {
    if (anomaliesOnly && (!r.meta?.anomalies || r.meta.anomalies.length === 0)) return false;
    if (fName && !(r.meta?.checkedBy || '').toLowerCase().includes(fName.toLowerCase()) && !(r.meta?.empId || '').toLowerCase().includes(fName.toLowerCase())) return false;
    return true;
  });

  if (open) {
    const { layout, sub } = open;
    const d = sheets.find((s) => s.sheetId === sub.sheetId);
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 max-w-[1400px] mx-auto pb-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button onClick={() => setOpen(null)} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-[14px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
        </div>

        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-glass dark:shadow-none flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="font-display text-[18px] font-bold text-slate-900 dark:text-white mb-1">Sheet #{sub.sheetId}: {d?.description}</div>
            <div className="flex flex-wrap items-center gap-3 text-[13px] font-medium text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {sub.date}</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {sub.shift} Shift</span>
              <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {sub.meta?.checkedBy || '—'} {sub.meta?.empId ? `(${sub.meta.empId})` : ''}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ZoomBar zoom={zoom} setZoom={setZoom} />
            <a href={api.xlsxUrl(sub.date, sub.shift, sub.sheetId)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-[14px] font-bold text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all">
              <Download className="w-4 h-4" /> Export Excel
            </a>
          </div>
        </div>

        {sub.meta?.anomalies?.length > 0 && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-500/20 dark:bg-rose-500/10 mb-4">
            <h3 className="flex items-center gap-2 text-sm font-bold text-rose-800 dark:text-rose-400 mb-2">
              <AlertTriangle className="w-4 h-4" /> Anomalies Detected
            </h3>
            <ul className="space-y-1 pl-6 list-disc">
              {sub.meta.anomalies.map((a, i) => (
                <li key={i} className="text-[13px] text-rose-700 dark:text-rose-300">
                  <span className="font-semibold">{a.rowKey && a.rowKey !== '—' ? `${a.rowKey} / ` : ''}{a.colKey}:</span> Expected {a.min !== undefined && a.max !== undefined ? `${a.min} - ${a.max}` : a.min !== undefined ? `> ${a.min}` : a.max !== undefined ? `< ${a.max}` : a.expected}, but recorded <strong>{a.value}</strong>.
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 overflow-hidden shadow-sm">
           <SheetGrid layout={layout} initialValues={sub.values || {}} editable={false} zoom={zoom} />
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-glass dark:shadow-none">
        <div>
          <label className={labelCls}>Filter by Sheet</label>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select className={`${inputCls} pl-10`} value={fSheet} onChange={(e) => setFSheet(e.target.value)}>
              <option value="">All sheets</option>
              {sheets.map((s) => <option key={s.sheetId} value={s.sheetId}>{`#${s.sheetId} — ${s.description}`}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className={labelCls}>Filter by Date</label>
          <input type="date" className={inputCls} value={fDate} onChange={(e) => setFDate(e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Filter by Name or ID</label>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="e.g. John or E1234" className={`${inputCls} pl-10`} value={fName} onChange={(e) => setFName(e.target.value)} />
          </div>
        </div>
      </div>

      {filteredRows.length === 0 && (
        <div className="rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-transparent py-20 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
          <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 grid place-items-center mb-4">
            <FileX className="w-8 h-8 text-slate-400 dark:text-slate-500" />
          </div>
          <div className="text-[16px] font-bold text-slate-700 dark:text-slate-300 mb-1">{anomaliesOnly ? 'No anomalies detected' : 'No submissions found'}</div>
          <div className="text-[14px]">Adjust your filters or fill a sheet in the Entry tab.</div>
        </div>
      )}

      <div className="space-y-3">
        {filteredRows.map((r, i) => {
          const d = sheets.find((s) => s.sheetId === r.sheetId);
          return (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              key={i} 
              onClick={() => view(r)} 
              className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-left hover:shadow-md hover:border-brand/30 dark:hover:border-brand/30 transition-all group active:scale-[.99] cursor-pointer"
            >
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand/10 dark:bg-brand/20 text-[15px] font-black text-brand dark:text-brand-light">#{r.sheetId}</div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[15px] font-bold text-slate-900 dark:text-slate-100 mb-1">{d?.description}</div>
                <div className="flex flex-wrap items-center gap-3 text-[12px] font-medium text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {r.date}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {r.shift} Shift</span>
                  <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {r.meta?.checkedBy || '—'} {r.meta?.empId ? `(${r.meta.empId})` : ''}</span>
                </div>
              </div>
              <div className="shrink-0 text-right pr-2 flex flex-col items-end gap-1.5">
                <span className={`rounded-full px-3 py-1 text-[11px] font-bold tracking-wide ${r.status === 'submitted' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400'}`}>{r.status === 'draft' ? 'Draft' : 'Submitted'}</span>
                {r.meta?.anomalies?.length > 0 && (
                  <span className="flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800 dark:bg-rose-500/20 dark:text-rose-400">
                    <AlertTriangle className="w-3 h-3" /> {r.meta.anomalies.length} Anomalies
                  </span>
                )}
                <div className="text-[11px] font-medium text-slate-400">{r.filledCount} filled</div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={(e) => handleEdit(e, r)} className="p-2 text-slate-400 hover:text-brand transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" title="Edit">
                  <FileEdit className="w-5 h-5" />
                </button>
                <button onClick={(e) => handleDelete(e, r)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" title="Delete">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
