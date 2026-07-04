# MMMS — System Requirements & Install Guide (new computer / server)

Everything needed to run the HSM Mill Shift Checklist app on a fresh machine.

## 1. System software (install these first)

| Software | Min version | Tested with | Why | Download |
|----------|-------------|-------------|-----|----------|
| **Node.js** (includes npm) | 18 LTS | 22.20.0 (npm 10.9.3) | runs the backend API and builds/serves the frontend | https://nodejs.org (LTS) |
| **Python** | 3.10 | 3.13.7 | the backend calls Python to stamp data into the Excel template | https://www.python.org/downloads/ |
| **Git** *(optional)* | any | 2.53 | to clone the project | https://git-scm.com |

> No database server is required — data is stored in a local JSON file (`lowdb`).
> **Critical:** `python` must be on the system **PATH**. The backend launches
> `python stamp.py` as a child process to generate the `.xlsx` download. On Windows,
> tick *"Add Python to PATH"* during install. Verify with `python --version`.
> (If your server only exposes `python3`, see the note at the bottom.)

## 2. Python packages

Only one, used by `stamp.py` (Excel download) and `extract.py` (schema generation):

```bash
cd backend
pip install -r requirements.txt        # openpyxl==3.1.5
```

## 3. Node packages (installed by `npm install`, listed here for reference)

**Backend** (`backend/package.json`):
| Package | Version | Purpose |
|---------|---------|---------|
| express | ^4.19.2 | REST API server |
| cors | ^2.8.5 | allow the frontend to call the API |
| lowdb | ^7.0.1 | embedded JSON database (`backend/data/db.json`) |

**Frontend** (`frontend/package.json`):
| Package | Version | Purpose |
|---------|---------|---------|
| react / react-dom | ^18.3.1 | UI |
| @tabler/icons-webfont | ^3.31.0 | icons (bundled locally, no CDN) |
| vite | ^5.4.2 | dev server + production bundler |
| @vitejs/plugin-react | ^4.3.1 | React support in Vite |
| tailwindcss | ^3.4.10 | styling |
| postcss | ^8.4.38 | Tailwind build step |
| autoprefixer | ^10.4.19 | CSS vendor prefixes |

## 4. Install & run (development)

```bash
# from the project root MMMS/

# --- backend ---
cd backend
npm install
pip install -r requirements.txt
npm start                      # API on http://localhost:4000

# --- frontend (second terminal) ---
cd frontend
npm install
npm run dev                    # UI on http://localhost:5173 (proxies /api -> 4000)
```
Open **http://localhost:5173**. To use it from a phone on the same network, run the
frontend with `npm run dev -- --host` and visit `http://<server-ip>:5173`.

## 5. Production deployment (single server)

The Vite dev proxy only exists in dev. For production, build the frontend to static
files and serve them; point the browser at the backend for `/api`.

```bash
# build static frontend
cd frontend && npm install && npm run build      # outputs frontend/dist/

# run backend (keep alive with pm2 or a systemd/Windows service)
cd ../backend && npm install && pip install -r requirements.txt
npm start                                         # http://<server>:4000
```
Then either:
- **Reverse proxy (recommended):** put Nginx/IIS in front — serve `frontend/dist/` as
  static files and proxy `/api/*` to `http://localhost:4000`. Single origin, no CORS.
- **Quick option:** serve `frontend/dist/` with any static host and set the API base
  URL; CORS is already enabled on the backend.

Process manager example (Node):
```bash
npm i -g pm2
pm2 start server.js --name mmms-api      # in backend/
pm2 save && pm2 startup                  # auto-start on boot
```

## 6. Files that must travel with the app
```
template/MillShiftCheckList.xlsx   the Excel template that gets stamped (required)
schemas/*.json                     generated form/layout definitions (required at runtime)
backend/  frontend/  docs/
```
`backend/data/db.json` is created automatically on first save. Re-run
`python backend/extract.py` only if the Excel template changes.

## 7. Minimum hardware
Tiny footprint: ~1 vCPU, 1 GB RAM, ~500 MB disk (mostly node_modules) is plenty for a
team. No GPU, no DB server.

---
### Note: server uses `python3` instead of `python`
If `python` isn't available but `python3` is, either create an alias/symlink, or change
the one line in `backend/server.js` that spawns the stamper:
```js
const py = spawn('python', [ ... ])   // change 'python' -> 'python3'
```
