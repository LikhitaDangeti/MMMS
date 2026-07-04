import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';

const colLetter = (n) => {
  let s = '';
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
};

// Excel column width unit -> approx pixels
const widthPx = (w) => Math.max(28, Math.round(w * 7 + 6));

/**
 * Faithful Excel-style grid.
 *  - editable=true  -> input cells become <input>, parent reads getValues()
 *  - editable=false -> input cells show the stored value (viewer)
 */
const SheetGrid = forwardRef(function SheetGrid({ layout, initialValues = {}, editable = false, zoom = 1 }, ref) {
  const store = useRef({ ...initialValues });

  useImperativeHandle(ref, () => ({
    getValues: () => ({ ...store.current }),
  }), []);

  // bucket anchored cells by row (cells array already omits merge-covered cells)
  const rows = useMemo(() => {
    const map = new Map();
    for (const c of layout.cells) {
      if (!map.has(c.r)) map.set(c.r, []);
      map.get(c.r).push(c);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]).map(([, cs]) => cs.sort((a, b) => a.c - b.c));
  }, [layout]);

  const cols = useMemo(() => {
    const arr = [];
    for (let c = 1; c <= layout.maxCol; c++) {
      const w = layout.colWidths?.[colLetter(c)];
      arr.push(widthPx(w || 9));
    }
    return arr;
  }, [layout]);

  return (
    <div className="overflow-auto border border-slate-300 bg-white" style={{ maxHeight: '72vh' }}>
      <table className="xl-table" style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
        <colgroup>
          {cols.map((w, i) => (
            <col key={i} style={{ width: w }} />
          ))}
        </colgroup>
        <tbody>
          {rows.map((cells, ri) => (
            <tr key={ri}>
              {cells.map((cell) => {
                const common = { rowSpan: cell.rs, colSpan: cell.cs };
                if (cell.k === 'input') {
                  if (editable) {
                    return (
                      <td key={cell.coord} {...common} className="xl-input" title={cell.coord}>
                        <input
                          defaultValue={initialValues[cell.coord] ?? ''}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v === '') delete store.current[cell.coord];
                            else store.current[cell.coord] = v;
                          }}
                        />
                      </td>
                    );
                  }
                  {
                    const v = initialValues[cell.coord] ?? '';
                    const nok = /^n?ok$/i.test(v) && v.toUpperCase() === 'NOK';
                    return (
                      <td key={cell.coord} {...common} className="xl-empty">
                        <span className={`xl-view-val ${nok ? 'xl-view-nok' : ''}`}>{v}</span>
                      </td>
                    );
                  }
                }
                if (cell.k === 'locked')
                  return (
                    <td key={cell.coord} {...common} className="xl-locked">
                      {cell.t}
                    </td>
                  );
                if (cell.k === 'label') {
                  const isTitle = cell.cs >= 6 && cell.b;
                  return (
                    <td key={cell.coord} {...common} className={isTitle ? 'xl-title' : 'xl-label'} style={{ fontWeight: cell.b ? 700 : 400 }}>
                      {cell.t}
                    </td>
                  );
                }
                return <td key={cell.coord} {...common} className="xl-empty" />;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

export default SheetGrid;
