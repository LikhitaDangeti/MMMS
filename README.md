# MMMS — HSM Mill Shift Checklist (Paper → Digital)

Mobile-first web app that digitizes the 13 Hot Strip Mill shift-inspection sheets.
Engineers pick **Date · Shift · Sheet**, fill a touch-friendly form (OK/NOK buttons,
number fields), and submit. A dashboard plays back any past shift in the original
Excel grid layout and downloads a **populated copy of the real `.xlsx` template**.

## Stack
| Layer | Choice |
|-------|--------|
| Frontend | React + Vite + Tailwind CSS (mobile-first), fully self-contained for Intranets |
| Backend | Node.js + Express (Modular structure with zero external security dependencies) |
| Database | PostgreSQL |
| Excel | Python + `openpyxl` stamps values into a copy of the original template |
| Auth | Local Storage Caching — Inspector types Name + Employee ID (auto-fills on next visit) |

## Prerequisites
- Node.js ≥ 18
- Python ≥ 3.10 with `openpyxl` (`pip install openpyxl`)
- Microsoft SQL Server (and SSMS to manage it)

## Run it (Offline / Intranet)
```bash
# 1) Start SQL Server and ensure `submissions` table exists 
#    (The app will auto-create it if SQLSERVER_URI is provided in .env)

# 2) backend  → http://localhost:4000
cd backend
npm start

# 3) frontend → http://localhost:5173
cd frontend
npm run dev
```

## How it works
1. **Schemas are generated from the Excel file**, not hand-written. `backend/extract.py`
   reads `template/MillShiftCheckList.xlsx` and produces layout files.
2. **Entry** groups fields into accordion sections. Checkpoints have keyboard-accessible OK/NOK buttons, and progress rings.
3. **Submit** saves one document per `(date, shift, sheet)` to SQL Server. `meta` and `values` are saved safely as JSON string columns.
4. **Dashboard** lists submissions; opening one renders the Excel grid (NOK shown red)
   and **⬇ Excel** streams a stamped copy of the original workbook.

## Project layout
```text
template/   MillShiftCheckList.xlsx        the stamping template
schemas/    sheetN.layout.json (+ schema)  generated, source of truth (~8,700 fields)
backend/    src/ (Controllers, Routes, Middleware, Services), db.js, stamp.py, extract.py
frontend/   src/ (App, EntryForm, Controls, Dashboard, SheetGrid)
docs/       DATA_MODEL.md  SETUP.md
```
