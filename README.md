# 🌱 co2Scan — Website Carbon Footprint Scanner

An open source tool to measure and analyze the carbon footprint of any website. Built with Node.js, React, PostgreSQL, and Lighthouse.

## Features

- **Guest scan** — scan any public URL without an account
- **Free plan** — 10 scans/day with full carbon analysis, quick wins, and recommendations
- **GO plan** — full site crawl (every page), pause/resume, advanced analytics, export reports
- CO₂ emissions, carbon score, grade (A+ to F), resource breakdown, unused code analysis
- Real-world impact equivalents (phone charges, car distance, trees needed)
- Location-aware carbon intensity (server + user country)

## Tech Stack

- **Backend** — Node.js, Express, TypeScript, Sequelize, PostgreSQL
- **Frontend** — React, TypeScript, Vite, Bootstrap 5, Recharts
- **Scanning** — Google Lighthouse, Chrome headless

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Google Chrome installed (for Lighthouse scanning)

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/VishalSale/co2Scan.git
cd co2Scan
```

### 2. Backend setup

```bash
cd backend
cp .env.example .env
# Edit .env with your database credentials and JWT secret
npm install
npm run dev
```

### 3. Frontend setup

```bash
cd frontend
cp .env.example .env
# Edit .env if your backend runs on a different port
npm install
npm run dev
```

### 4. Database

The backend uses Sequelize with `alter: true` sync — it will auto-create and update tables on startup. Just make sure your PostgreSQL database exists:

```sql
CREATE DATABASE co2scan;
```

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `NODE_ENV` | `dev` or `production` |
| `NODE_PORT` | Port to run the server (default: 8080) |
| `NODE_AUTH_SECRET` | JWT signing secret — use a long random string |
| `DB_HOST` | PostgreSQL host |
| `DB_PORT` | PostgreSQL port (default: 5432) |
| `DB_USERNAME` | PostgreSQL username |
| `DB_PASSWORD` | PostgreSQL password |
| `DB_NAME` | Database name |
| `CLIENT` | Frontend URL for CORS (e.g. http://localhost:3000) |

### Frontend (`frontend/.env`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API URL (e.g. http://localhost:8080) |

## Project Structure

```
co2Scan/
├── backend/
│   └── src/
│       ├── config/        # DB, plans, constants
│       ├── controller/    # Route handlers (guest, free, go)
│       ├── middleware/    # Auth middleware
│       ├── model/         # Sequelize models
│       ├── route/         # Express routes
│       ├── services/      # Crawl worker, queue, rate limiter
│       └── utils/         # Carbon calculator, Lighthouse helpers
└── frontend/
    └── src/
        ├── components/    # Reusable UI components
        ├── contexts/      # Auth context
        ├── pages/         # Public and dashboard pages
        ├── services/      # API service
        └── types/         # TypeScript types
```

## Plans

| Feature | Guest | Free | GO |
|---|---|---|---|
| Scans per day | 5 | 10 | 50 |
| Pages per scan | 1 | 1 | 100 |
| Scan history | ❌ | 7 days | Unlimited |
| Full site crawl | ❌ | ❌ | ✅ |
| Pause / Resume | ❌ | ❌ | ✅ |
| Analytics | ❌ | ❌ | ✅ |
| Export (JSON/CSV) | ❌ | ❌ | ✅ |

> Billing is not implemented. All plans are available for self-hosted deployments.

## Contributing

Contributions are welcome. Please open an issue first to discuss what you'd like to change.

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

## Author

**Vishal Sale** — [github.com/VishalSale](https://github.com/VishalSale)

## License

[MIT](LICENSE)
