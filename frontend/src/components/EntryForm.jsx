import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, CheckCircle2, Save, Send } from 'lucide-react';
import { api } from '../api.js';
import { CheckControl, cn } from './Controls.jsx';

const SHIFTS = ['A', 'B', 'C'];
const today = () => new Date().toISOString().slice(0, 10);
const HDR_NOISE = /^(sn|sl ?no|device ?name|equipment|stand|motor name|motor|field device|stand motor)$/i;

const filledCount = (fields, store) =>
  fields.reduce((n, f) => n + (store.current[f.cell] != null && store.current[f.cell] !== '' ? 1 : 0), 0);

function buildSections(fields) {
  const order = []; const map = new Map();
  for (const f of fields) {
    const rk = (f.rowKey || '').trim();
    if (HDR_NOISE.test(rk)) continue; 
    const sec = f.section || 'General';
    if (!map.has(sec)) { map.set(sec, { section: sec, uOrder: [], units: new Map() }); order.push(sec); }
    const S = map.get(sec);
    const ukey = rk || f.subGroup || '—';
    if (!S.units.has(ukey)) { S.units.set(ukey, { rowKey: rk || '—', equipment: f.equipment || '', cOrder: [], clusters: new Map() }); S.uOrder.push(ukey); }
    const U = S.units.get(ukey);
    const sg = f.subGroup || '';
    if (!U.clusters.has(sg)) { U.clusters.set(sg, []); U.cOrder.push(sg); }
    U.clusters.get(sg).push(f);
  }
  return order.map((s) => {
    const S = map.get(s);
    const units = S.uOrder.map((u) => {
      const U = S.units.get(u);
      const clusters = U.cOrder.map((sg) => ({ subGroup: sg, fields: U.clusters.get(sg) }));
      const all = clusters.flatMap((c) => c.fields);
      return { rowKey: U.rowKey, equipment: U.equipment, clusters, fields: all, choiceCells: all.filter((f) => f.ft === 'choice') };
    }).filter((u) => u.fields.length);
    const all = units.flatMap((u) => u.fields);
    return { section: s, units, fields: all, choiceCells: all.filter((f) => f.ft === 'choice') };
  }).filter((sec) => sec.units.length);
}

function Pill({ children, tone = 'slate' }) {
  const map = { 
    slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300', 
    green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' 
  };
  return <span className={cn('shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide', map[tone])}>{children}</span>;
}

function AllOk({ onClick }) {
  return (
    <button 
      onClick={onClick} 
      className="shrink-0 flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 transition-colors"
    >
      <CheckCircle2 className="w-3 h-3" />
      All OK
    </button>
  );
}

function Stand({ unit, store, onBump, bumpVer }) {
  const [open, setOpen] = useState(false);
  const filled = filledCount(unit.fields, store);
  const allOk = (e) => { e.stopPropagation(); unit.choiceCells.forEach((f) => (store.current[f.cell] = 'OK')); bumpVer(); onBump(); setOpen(true); };
  
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-[0_2px_10px_rgb(0,0,0,0.02)] dark:shadow-none mb-3 last:mb-0">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
        <motion.div animate={{ rotate: open ? 90 : 0 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
          <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500" />
        </motion.div>
        <span className="min-w-0 flex-1 truncate text-[14px] font-bold text-brand dark:text-brand-light">{unit.rowKey === '—' ? 'Checks' : unit.rowKey}</span>
        <Pill tone={filled === unit.fields.length ? 'green' : 'slate'}>{filled}/{unit.fields.length}</Pill>
        {unit.choiceCells.length > 0 && <AllOk onClick={allOk} />}
      </button>
      
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 p-3 sm:p-4">
              {unit.clusters.map((cl, i) => (
                <div key={i} className="rounded-xl bg-white dark:bg-slate-900 px-4 py-2 shadow-sm border border-slate-100 dark:border-slate-800">
                  {cl.subGroup && <div className="border-b border-dashed border-slate-200 dark:border-slate-700 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{cl.subGroup}</div>}
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {cl.fields.map((f) => <CheckControl key={f.cell} field={f} store={store} onBump={onBump} />)}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Section({ sec, store, onBump }) {
  const [open, setOpen] = useState(false);
  const [ver, setVer] = useState(0);
  const filled = filledCount(sec.fields, store);
  const allOk = (e) => { e.stopPropagation(); sec.choiceCells.forEach((f) => (store.current[f.cell] = 'OK')); setVer((v) => v + 1); onBump(); setOpen(true); };
  
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-glass dark:shadow-none mb-4">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-3 bg-slate-50 dark:bg-slate-900 px-4 sm:px-5 py-4 text-left group">
        <motion.div animate={{ rotate: open ? 90 : 0 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-brand dark:group-hover:text-brand-light transition-colors" />
        </motion.div>
        <span className="min-w-0 flex-1 truncate text-[16px] font-display font-bold text-slate-800 dark:text-slate-100">{sec.section}</span>
        <Pill tone={filled === sec.fields.length ? 'green' : 'slate'}>{filled}/{sec.fields.length}</Pill>
        {sec.choiceCells.length > 0 && <AllOk onClick={allOk} />}
      </button>
      
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <div key={ver} className="space-y-1 border-t border-slate-100 dark:border-slate-800 p-3 sm:p-5">
              {sec.units.map((unit, i) => {
                const prev = sec.units[i - 1];
                const showEquip = unit.equipment && unit.equipment !== prev?.equipment;
                return (
                  <div key={i}>
                    {showEquip && <div className="px-2 pb-2 pt-4 text-[13px] font-bold text-slate-700 dark:text-slate-300">{unit.equipment}</div>}
                    <Stand unit={unit} store={store} onBump={onBump} bumpVer={() => setVer((v) => v + 1)} />
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const inputCls = "w-full rounded-xl border-[1.5px] border-slate-300 bg-white px-4 py-3 text-[14px] font-medium focus:border-brand focus:ring-1 focus:ring-brand outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-brand transition-all";
const labelCls = "block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 ml-1";

export default function EntryForm({ sheets, initialContext }) {
  const [date, setDate] = useState(initialContext?.date || today());
  const [shift, setShift] = useState(initialContext?.shift || 'A');
  const [sheetId, setSheetId] = useState(initialContext?.sheetId || 1);
  const [layout, setLayout] = useState(null);
  const [meta, setMeta] = useState({ checkedBy: localStorage.getItem('mmms_checkedBy') || '', empId: localStorage.getItem('mmms_empId') || '', remarks: '' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [filled, setFilled] = useState(0);
  const [loadKey, setLoadKey] = useState(0);
  const store = useRef({});
  const bump = useCallback(() => setFilled(Object.keys(store.current).length), []);

  const abortRef = useRef(null);

  async function load() {
    // Cancel any in-flight request from a previous selection
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true); setMsg(null);
    try {
      const [lay, existing] = await Promise.all([
        api.layout(sheetId),
        api.get(date, shift, sheetId)
      ]);

      // If aborted (user changed selection), discard result
      if (controller.signal.aborted) return;
      const newStore = { ...(existing?.values || {}) };
      // Auto-fill remarks fields
      lay.fields.forEach(f => {
        if (f.ft === 'text' && (f.colKey || '').toLowerCase().includes('remark')) {
          if (newStore[f.cell] === undefined || newStore[f.cell] === '') {
            newStore[f.cell] = 'no remarks';
          }
        }
      });
      
      store.current = newStore;
      setLayout(lay);
      setMeta({ checkedBy: existing?.meta?.checkedBy || localStorage.getItem('mmms_checkedBy') || '', empId: existing?.meta?.empId || localStorage.getItem('mmms_empId') || '', remarks: existing?.meta?.remarks || '' });
      setFilled(Object.keys(store.current).length);
      setLoadKey((k) => k + 1);
      if (existing) setMsg({ kind: 'info', text: 'Loaded saved entry — editing updates it.' });
    } catch (e) { setMsg({ kind: 'err', text: e.error || 'Failed to load sheet' }); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [date, shift, sheetId]);

  const sections = useMemo(() => (layout ? buildSections(layout.fields) : []), [layout, loadKey]);
  const total = useMemo(() => sections.reduce((n, s) => n + s.fields.length, 0), [sections]);

  async function save(status) {
    setMsg(null);
    try {
      const anomalies = [];
      if (layout && layout.fields) {
        layout.fields.forEach(f => {
          const rawVal = store.current[f.cell];
          if (rawVal !== undefined && rawVal !== '') {
            if (f.ft === 'number') {
              const val = Number(rawVal);
              if ((f.min !== undefined && val < f.min) || (f.max !== undefined && val > f.max)) {
                anomalies.push({
                  cell: f.cell,
                  colKey: f.colKey,
                  rowKey: f.rowKey,
                  value: val,
                  min: f.min,
                  max: f.max
                });
              }
            } else if (f.ft === 'choice' && f.anomaly_if && f.anomaly_if.includes(rawVal)) {
              anomalies.push({
                cell: f.cell,
                colKey: f.colKey,
                rowKey: f.rowKey,
                value: rawVal,
                expected: `Not ${f.anomaly_if.join(' or ')}`
              });
            }
          }
        });
      }
      const newMeta = { ...meta, anomalies };

      await api.save({ date, shift, sheetId: Number(sheetId), meta: newMeta, values: store.current, status });
      setMsg({ kind: 'ok', text: `${status === 'draft' ? 'Draft saved' : 'Submitted'} — ${Object.keys(store.current).length} checks recorded. ${anomalies.length > 0 ? `(${anomalies.length} anomalies detected)` : ''}` });
    } catch (e) { setMsg({ kind: 'err', text: (e.errors || [e.error]).join(', ') || 'Save failed' }); }
  }

  const desc = sheets.find((s) => s.sheetId === Number(sheetId));
  const pct = total ? Math.round((filled / total) * 100) : 0;

  return (
    <div className="space-y-5 pb-32 max-w-3xl mx-auto">
      {/* Header Info Card */}
      <div className="space-y-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-glass dark:shadow-none">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Date</label>
            <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Shift</label>
            <select className={inputCls} value={shift} onChange={(e) => setShift(e.target.value)}>
              {SHIFTS.map((s) => <option key={s} value={s}>{s} Shift</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className={labelCls}>Checklist Sheet</label>
          <select className={inputCls} value={sheetId} onChange={(e) => setSheetId(Number(e.target.value))}>
            {sheets.map((s) => <option key={s.sheetId} value={s.sheetId}>{`#${s.sheetId} — ${s.description}`}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Inspector Name</label>
            <input className={inputCls} value={meta.checkedBy} onChange={(e) => { setMeta({ ...meta, checkedBy: e.target.value }); localStorage.setItem('mmms_checkedBy', e.target.value); }} placeholder="e.g. R. Kumar" />
          </div>
          <div>
            <label className={labelCls}>Employee ID</label>
            <input className={inputCls} value={meta.empId} onChange={(e) => { setMeta({ ...meta, empId: e.target.value }); localStorage.setItem('mmms_empId', e.target.value); }} placeholder="e.g. E1234" />
          </div>
        </div>
      </div>

      {desc && (
        <div className="flex items-center justify-between gap-4 rounded-3xl bg-slate-900 dark:bg-slate-800 px-6 py-5 text-white shadow-lg shadow-slate-900/20">
          <div className="min-w-0">
            <div className="font-display truncate text-[17px] font-bold">Sheet #{desc.sheetId}: {desc.description}</div>
            <div className="text-[13px] text-slate-300 font-medium mt-0.5">{filled} of {total} checkpoints filled</div>
          </div>
          <div className="relative h-14 w-14 shrink-0">
            <svg viewBox="0 0 36 36" className="h-14 w-14 -rotate-90">
              <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
              <motion.circle 
                cx="18" cy="18" r="15" fill="none" stroke="#2dd4bf" strokeWidth="4" strokeLinecap="round"
                initial={{ strokeDasharray: "0 94.2" }}
                animate={{ strokeDasharray: `${(pct / 100) * 94.2} 94.2` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[12px] font-bold">{pct}%</span>
          </div>
        </div>
      )}

      {msg && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className={cn(
            "rounded-2xl px-4 py-3 text-[14px] font-medium shadow-sm border",
            msg.kind === 'ok' ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 
            msg.kind === 'err' ? 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20' : 
            'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20'
          )}
        >
          {msg.text}
        </motion.div>
      )}

      {loading && (
        <div className="py-16 text-center text-slate-400 font-medium flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-4 border-brand border-t-transparent animate-spin"></div>
          Loading checklist…
        </div>
      )}
      
      {!loading && layout && (
        <div className="space-y-4">
          {sections.map((sec, i) => <Section key={`${loadKey}-${i}`} sec={sec} store={store} onBump={bump} />)}
        </div>
      )}

      {/* Sticky Bottom Bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 px-4 py-4 backdrop-blur-xl pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-10px_40px_rgb(0,0,0,0.05)]">
        <div className="mx-auto flex max-w-3xl gap-3">
          <button onClick={() => save('draft')} className="flex-1 flex items-center justify-center gap-2 rounded-2xl border-[1.5px] border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-3.5 text-[15px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[.98] transition-all">
            <Save className="w-4 h-4" /> Save Draft
          </button>
          <button onClick={() => save('submitted')} className="flex-[2] flex items-center justify-center gap-2 rounded-2xl bg-brand dark:bg-brand-dark py-3.5 text-[15px] font-bold text-white hover:bg-brand-dark dark:hover:bg-brand active:scale-[.98] shadow-lg shadow-brand/30 transition-all">
            <Send className="w-4 h-4" /> Submit Shift Data
          </button>
        </div>
      </div>
    </div>
  );
}
