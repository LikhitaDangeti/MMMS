import { useState, memo } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const getBtnStyle = (opt, isOn, field) => {
  const o = opt.toLowerCase();
  
  if (!isOn) {
    return 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800';
  }

  if (field?.anomaly_if?.includes(opt)) {
    return 'border-rose-500 bg-rose-500 text-white shadow-md shadow-rose-500/20';
  }

  // Active styles
  if (o === 'ok' || o === 'green' || o === 'no' || o === 'auto') 
    return 'border-emerald-500 bg-emerald-500 text-white shadow-md shadow-emerald-500/20';
  if (o === 'nok' || o === 'red' || o === 'yes' || o === 'manual') 
    return 'border-rose-500 bg-rose-500 text-white shadow-md shadow-rose-500/20';
  if (o === 'yellow') 
    return 'border-amber-500 bg-amber-500 text-white shadow-md shadow-amber-500/20';
  
  // Default active (NA)
  return 'border-slate-500 bg-slate-500 text-white shadow-md shadow-slate-500/20';
};

/** One checkpoint control. Uncontrolled-ish: keeps local state, writes to store. */
export const CheckControl = memo(function CheckControl({ field, store, onBump }) {
  const [val, setVal] = useState(store.current[field.cell] ?? '');

  const set = (v) => {
    setVal(v);
    if (v === '' || v == null) delete store.current[field.cell];
    else store.current[field.cell] = v;
    onBump && onBump();
  };

  return (
    <div className="flex items-start justify-between gap-4 py-3 group">
      <div className="min-w-0 flex-1 pt-1.5">
        <label htmlFor={`field-${field.cell}`} className="text-[14px] font-medium leading-snug text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors">
          {field.colKey || field.cell}
        </label>
      </div>
      <div className="shrink-0">
        {field.ft === 'choice' && field.opts ? (
          <div className="relative flex flex-col items-end gap-1">
            <div className="flex flex-wrap gap-1.5 justify-end" role="group" aria-label="Choices">
              {field.opts.map((opt) => {
                const isOn = val === opt;
                return (
                  <motion.button
                    key={opt}
                    type="button"
                    whileTap={{ scale: 0.92 }}
                    className={cn(
                      "min-h-[38px] min-w-[50px] px-3.5 rounded-xl border-[1.5px] text-[13px] font-bold transition-colors duration-200 select-none outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-950",
                      getBtnStyle(opt, isOn, field)
                    )}
                    onClick={() => set(isOn ? '' : opt)}
                    aria-pressed={isOn}
                  >
                    {opt}
                  </motion.button>
                );
              })}
            </div>
            {val !== '' && field.anomaly_if && field.anomaly_if.includes(val) && (
              <div className="absolute top-full mt-1 right-0 text-[10px] font-bold text-rose-500 dark:text-rose-400 whitespace-nowrap bg-rose-50 dark:bg-rose-500/10 px-1.5 py-0.5 rounded-md border border-rose-100 dark:border-rose-500/20 shadow-sm z-10">
                Anomaly Detected
              </div>
            )}
          </div>
        ) : field.ft === 'number' ? (
          <div className="relative flex flex-col items-end">
            <input
              id={`field-${field.cell}`}
              type="number"
              inputMode="decimal"
              value={val}
              onChange={(e) => set(e.target.value)}
              className={cn(
                "h-[40px] w-24 rounded-xl border-[1.5px] bg-white px-3 text-center text-[14px] font-medium text-slate-900 placeholder-slate-400 focus:ring-1 outline-none transition-all dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-600",
                val !== '' && ((field.min !== undefined && Number(val) < field.min) || (field.max !== undefined && Number(val) > field.max))
                  ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500 text-rose-600 dark:text-rose-400" 
                  : "border-slate-300 focus:border-brand focus:ring-brand dark:border-slate-700 dark:focus:border-brand"
              )}
              placeholder="—"
            />
            {val !== '' && ((field.min !== undefined && Number(val) < field.min) || (field.max !== undefined && Number(val) > field.max)) && (
              <div className="absolute top-[calc(100%+4px)] right-0 text-[10px] font-bold text-rose-500 dark:text-rose-400 whitespace-nowrap bg-rose-50 dark:bg-rose-500/10 px-1.5 py-0.5 rounded-md border border-rose-100 dark:border-rose-500/20 shadow-sm z-10">
                {field.min !== undefined && field.max !== undefined ? `Range: ${field.min}-${field.max}` : field.min !== undefined ? `Min: ${field.min}` : `Max: ${field.max}`}
              </div>
            )}
          </div>
        ) : field.ft === 'datetime' ? (
          <input
            id={`field-${field.cell}`}
            type="datetime-local"
            value={val}
            onChange={(e) => set(e.target.value)}
            className="h-[40px] rounded-xl border-[1.5px] border-slate-300 bg-white px-3 text-[14px] font-medium text-slate-900 placeholder-slate-400 focus:border-brand focus:ring-1 focus:ring-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-600 outline-none transition-all"
          />
        ) : (
          <input
            id={`field-${field.cell}`}
            type="text"
            value={val}
            onChange={(e) => set(e.target.value)}
            className="h-[40px] w-40 rounded-xl border-[1.5px] border-slate-300 bg-white px-3 text-[14px] font-medium text-slate-900 placeholder-slate-400 focus:border-brand focus:ring-1 focus:ring-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-600 outline-none transition-all"
            placeholder="—"
          />
        )}
      </div>
    </div>
  );
});
