# Green Carbon Scanner - Frontend

Modern React + TypeScript frontend for the Green Website Carbon Scanner platform.

## 🚀 Features

- **Modern 2026 Design**: Glassmorphism, gradients, smooth animations
- **3 User Panels**: Guest, Free User (10 scans/day), GO User (unlimited)
- **14 Pages**: 5 public + 9 dashboard pages
- **Easy API Integration**: Centralized API service with Axios
- **Role-Based Access**: Protected routes and feature gating
- **Responsive Design**: Mobile-first approach with Bootstrap 5

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable components
│   │   ├── GradeBadge.tsx
│   │   ├── ScoreCircle.tsx
│   │   ├── StatCard.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── GuestRoute.tsx
│   ├── contexts/            # React contexts
│   │   └── AuthContext.tsx
│   ├── layouts/             # Layout components
│   │   ├── PublicLayout.tsx
│   │   └── DashboardLayout.tsx
│   ├── pages/
│   │   ├── public/          # Public pages
│   │   │   ├── LandingPage.tsx
│   │   │   ├── PricingPage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   └── ScanResultPage.tsx
│   │   └── dashboard/       # Protected dashboard pages
│   │       ├── Dashboard.tsx
│   │       ├── ScanWebsite.tsx
│   │       ├── ScanHistory.tsx
│   │       ├── WebsiteReport.tsx
│   │       ├── Profile.tsx
│   │       ├── Settings.tsx
│   │       ├── Billing.tsx
│   │       ├── ExportReport.tsx
│   │       └── Analytics.tsx
│   ├── services/            # API services
│   │   └── api.service.ts
│   ├── types/               # TypeScript types
│   │   └── index.ts
│   ├── App.tsx              # Main app with routing
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
├── index.html
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## 🛠️ Installation

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Update `.env` with your backend URL:
```
VITE_API_URL=http://localhost:5000
```

## 🚀 Running the App

Development mode:
```bash
npm run dev
```

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## 🔌 API Integration

All API calls are centralized in `src/services/api.service.ts`. The service automatically:
- Adds authentication tokens to requests
- Handles 401 errors (auto-logout)
- Provides typed methods for all endpoints

### Example Usage:

```typescript
import apiService from './services/api.service'

// Login
const response = await apiService.login(email, password)

// Scan website
const result = await apiService.scanWebsite(url)

// Get scan history
const history = await apiService.getScanHistory()
```

## 📄 Pages Overview

### Public Pages (Guest Access)
1. **Landing Page** (`/`) - Hero, features, scan input
2. **Pricing Page** (`/pricing`) - Plan comparison
3. **Login Page** (`/login`) - User authentication
4. **Register Page** (`/register`) - User registration
5. **Scan Result Page** (`/scan-result`) - Display scan results

### Dashboard Pages (Authenticated)
1. **Dashboard** (`/dashboard`) - Overview, stats, recent scans
2. **Scan Website** (`/scan`) - Scan form
3. **Scan History** (`/history`) - All scans with filters
4. **Website Report** (`/report/:id`) - Detailed scan report
5. **Profile** (`/profile`) - User profile management
6. **Settings** (`/settings`) - Account settings
7. **Billing** (`/billing`) - Subscription management
8. **Export Report** (`/export`) - Export scans (GO only)
9. **Analytics** (`/analytics`) - Advanced analytics (GO only)

## 🎨 Design System

### Colors
- Primary: `#10b981` (Green)
- Secondary: `#3b82f6` (Blue)
- Dark: `#0f172a`
- Success: `#22c55e`
- Warning: `#f59e0b`
- Danger: `#ef4444`

### Components
- **Glass Cards**: Glassmorphism effect with backdrop blur
- **Glow Buttons**: Gradient buttons with hover effects
- **Grade Badges**: A-F grading with color coding
- **Score Circles**: Circular progress indicators
- **Stat Cards**: Icon + title + value cards

## 🔐 Authentication

Authentication is handled via JWT tokens stored in localStorage:
- Login/Register stores token and user data
- Protected routes check authentication status
- API service automatically adds token to requests
- 401 responses trigger auto-logout

## 🎯 User Plans

### Guest (Not Logged In)
- Single page scan
- View results
- No history

### Free User
- 10 scans per day
- Last 10 scans history
- Full carbon analysis
- Quick win recommendations

### GO User (Premium)
- Unlimited scans
- Unlimited history
- Advanced analytics
- Export reports (PDF/CSV/JSON)
- Priority support

## 🔄 Backend Integration

The frontend expects these backend endpoints:

### Auth
- `POST /auth/login` - Login
- `POST /auth/register` - Register

### Scans
- `POST /auth/home/co2-consumption` - Scan website
- `GET /auth/history` - Get scan history
- `GET /auth/report/:id` - Get scan report

### User
- `GET /auth/profile` - Get user profile
- `PUT /auth/profile` - Update profile
- `POST /auth/change-password` - Change password

### Dashboard
- `GET /auth/dashboard/stats` - Get dashboard stats

### Billing
- `GET /auth/billing` - Get billing info

### Export
- `GET /auth/export/:id?format=pdf|csv|json` - Export report

## 🐛 Troubleshooting

### CORS Issues
Make sure your backend allows requests from `http://localhost:3000`

### API Connection
Check that `VITE_API_URL` in `.env` matches your backend URL

### Build Errors
Run `npm install` to ensure all dependencies are installed

## 📝 Notes

- The design uses modern CSS features (backdrop-filter, gradients, animations)
- All components are TypeScript for type safety
- Bootstrap 5 is used for responsive grid and utilities
- Vite is used for fast development and optimized builds
- Easy to extend with new pages and features

## 🚀 Next Steps

1. Install dependencies: `npm install`
2. Start backend server on port 5000
3. Start frontend: `npm run dev`
4. Open browser to `http://localhost:3000`
5. Test the flow: Register → Login → Scan → View Results

Enjoy building a greener web! 🌱
