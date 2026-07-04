# MMMS — Environment & Setup

## What you already have ✅
| Tool | Version | Used for |
|------|---------|----------|
| Node.js | 22.20.0 | React frontend + Node backend |
| npm | 10.9.3 | package manager |
| Python | 3.13.7 | Excel analysis and stamping (`openpyxl`) |
| SQL Server | - | Database |
| Git | 2.53.0 | version control |

## Setting up SQL Server
1. Download **Microsoft SQL Server Express** (or Developer) and install it.
2. Download **SQL Server Management Studio (SSMS)**.
3. Open SSMS, connect to your server, and create a database named `mmms`.
4. Ensure SQL Server authentication is enabled and the `sa` user has a password.
5. Provide the connection string to the backend.

## Backend Configuration
Create a `.env` file in the `backend/` directory:
```env
SQLSERVER_URI=Server=localhost,1433;Database=mmms;User Id=sa;Password=YourPassword;Encrypt=true;TrustServerCertificate=true;
```

## Install commands
Since the application is designed to run in an offline intranet environment, ensure you run these commands on a machine with internet access before moving the project to the intranet:

```bash
# backend
cd backend
npm install

# frontend
cd frontend
npm install
```

Once dependencies are installed, you can run `npm start` in the backend and `npm run dev` in the frontend entirely offline.
