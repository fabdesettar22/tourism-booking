# You Need Travel (mybridge.my)

B2B2C travel platform built with Django REST Framework + React (Vite + TypeScript) for Malaysian travel agencies. Multi-tenant with strict financial precision (Decimal, never Float).

## Tech Stack
- Backend: Django 6.x, Django REST Framework, SimpleJWT
- Database: SQLite (development) / PostgreSQL (production target)
- Frontend: React + TypeScript + Vite + Tailwind CSS
- i18n: en / ms / ar (RTL support)

## Prerequisites (Windows)
| Tool | Version |
|---|---|
| Python | 3.11 or 3.12 |
| Node.js | 20 LTS+ |
| Git | latest |

Verify in PowerShell:
    python --version
    node --version
    git --version

## Setup

### 1. Clone
    git clone https://github.com/fabdesettar22/tourism-booking.git
    cd tourism-booking

### 2. Backend (PowerShell)
    python -m venv venv
    venv\Scripts\activate
    pip install --upgrade pip
    pip install -r requirements.txt
    copy .env.example .env

Open `.env` in Notepad and fill values:
- SECRET_KEY (random 50+ chars)
- JWT_SIGNING_KEY (separate random string)
- Email vars: leave empty for local dev unless testing email

### 3. Database (SQLite)
The project owner shares `db.sqlite3` separately (Google Drive — not in this repo).
Place it in the project root: `tourism-booking/db.sqlite3`

If no DB file is provided, run from scratch:
    python manage.py migrate
    python manage.py createsuperuser

### 4. Run backend
    python manage.py runserver

Backend: http://localhost:8000/
Admin:   http://localhost:8000/admin/

### 5. Frontend (open a new PowerShell window)
    cd frontend
    npm install

Create `frontend\.env.local` with:
    VITE_API_BASE_URL=http://localhost:8000/api

Run dev server:
    npm run dev

Frontend: http://localhost:5173/

## Project Structure
    tourism_booking/
    ├── apps/          Django apps (accounts, bookings, suppliers, ...)
    ├── config/        settings.py, urls.py
    ├── frontend/      React + Vite app
    ├── manage.py
    ├── requirements.txt
    ├── .env.example
    └── README.md

## Common Commands
| Task | Command |
|---|---|
| Activate venv | `venv\Scripts\activate` |
| Run backend | `python manage.py runserver` |
| Make migrations | `python manage.py makemigrations` |
| Apply migrations | `python manage.py migrate` |
| Run frontend | `npm run dev` (inside frontend/) |
| Build frontend | `npm run build` |

## Notes
- Private MVP repo. Never push `.env` or `db.sqlite3` to public repos.
- Financial fields use DecimalField only — never modify to FloatField.
