# You Need Travel

B2B2C travel platform built with Django REST Framework + React (Vite + TypeScript) for Malaysian travel agencies. Multi-tenant with strict financial precision.

## Tech Stack
- Backend: Django 6.x, Django REST Framework, SimpleJWT
- Database: PostgreSQL 14+
- Frontend: React + TypeScript + Vite + Tailwind CSS
- i18n: en / ms / ar (RTL support)

## Prerequisites (Windows)
| Tool | Version | Download |
|---|---|---|
| Python | 3.11 or 3.12 | https://www.python.org/downloads/windows/ |
| PostgreSQL | 14+ | https://www.postgresql.org/download/windows/ |
| Node.js | 20 LTS+ | https://nodejs.org/ |
| Git | latest | https://git-scm.com/download/win |

During PostgreSQL install: remember the postgres superuser password.

Verify in PowerShell:

    python --version
    node --version
    psql --version
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

Open .env in Notepad and fill values (see section 5).

### 3. Create database and user

Open SQL Shell (psql) from the Start menu, log in as postgres, then:

    CREATE USER tourism_user WITH PASSWORD 'choose-a-strong-password';
    CREATE DATABASE tourism_db OWNER tourism_user;
    GRANT ALL PRIVILEGES ON DATABASE tourism_db TO tourism_user;
    \q

### 4. Restore database from dump

The project owner will share tourism_db_backup.dump separately (Google Drive — not in this repo).

Place it at C:\Users\<your-user>\Desktop\tourism_db_backup.dump, then in PowerShell:

    pg_restore -U postgres -h localhost -d tourism_db --no-owner --no-privileges -v "C:\Users\<your-user>\Desktop\tourism_db_backup.dump"

If pg_restore is not recognized, add PostgreSQL bin to PATH:
C:\Program Files\PostgreSQL\<version>\bin

### 5. Configure .env

Edit .env and set:

    DATABASE_URL=postgresql://tourism_user:choose-a-strong-password@localhost:5432/tourism_db
    SECRET_KEY=<generate-a-random-50-char-string>
    DEBUG=True
    ALLOWED_HOSTS=localhost,127.0.0.1

Replace choose-a-strong-password with the password you set in step 3.
Other email/JWT vars: leave defaults or empty for local dev.

### 6. Run backend

    python manage.py runserver

Backend: http://localhost:8000/
Admin:   http://localhost:8000/admin/

### 7. Frontend (open a new PowerShell window)

    cd frontend
    npm install

Create frontend\.env.local with:

    VITE_API_BASE_URL=http://localhost:8000/api

Run dev server:

    npm run dev

Frontend: http://localhost:5173/

## Project Structure

    tourism_booking/
    ├── apps/          Django apps (accounts, bookings, suppliers, ...)
    ├── config/        settings.py, urls.py
    ├── core/          cross-cutting (managers, middleware, permissions)
    ├── tenants/       multi-tenancy core
    ├── frontend/      React + Vite app
    ├── manage.py
    ├── requirements.txt
    ├── .env.example
    └── README.md

## Common Commands
| Task | Command |
|---|---|
| Activate venv | venv\Scripts\activate |
| Run backend | python manage.py runserver |
| Make migrations | python manage.py makemigrations |
| Apply migrations | python manage.py migrate |
| Run frontend | npm run dev (inside frontend/) |
| Build frontend | npm run build |

## Troubleshooting

psycopg2 install fails on Windows: pip install psycopg2-binary

Port 8000 already in use: python manage.py runserver 8001

pg_restore fails with "role does not exist": create the user first (step 3)

Migrations conflict after restore: do NOT run migrate after pg_restore

## Notes
- Private MVP repo. Never push .env or database dumps to public repos.
- Financial fields use DecimalField only — never modify to FloatField.
- Multi-tenancy uses shared DB + tenant_id FK.
