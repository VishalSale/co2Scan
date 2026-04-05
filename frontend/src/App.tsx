import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import PublicLayout from './layouts/PublicLayout'
import DashboardLayout from './layouts/DashboardLayout'
import ProtectedRoute from './components/ProtectedRoute'
import GuestRoute from './components/GuestRoute'

// Public Pages
import LandingPage from './pages/public/LandingPage'
import PricingPage from './pages/public/PricingPage'
import LoginPage from './pages/public/LoginPage'
import RegisterPage from './pages/public/RegisterPage'
import ScanResultPage from './pages/public/ScanResultPage'

// Dashboard Pages
import Dashboard from './pages/dashboard/Dashboard'
import ScanWebsite from './pages/dashboard/ScanWebsite'
import ScanHistory from './pages/dashboard/ScanHistory'
import WebsiteReport from './pages/dashboard/WebsiteReport'
import CrawlReport from './pages/dashboard/CrawlReport'
import CrawlDetails from './pages/dashboard/CrawlDetails'
import Profile from './pages/dashboard/Profile'
import Settings from './pages/dashboard/Settings'
import Billing from './pages/dashboard/Billing'
import ExportReport from './pages/dashboard/ExportReport'
import Analytics from './pages/dashboard/Analytics'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="animated-bg" />
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/scan-result" element={<ScanResultPage />} />
            <Route element={<GuestRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>
          </Route>

          {/* Protected Dashboard Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/scan" element={<ScanWebsite />} />
              <Route path="/history" element={<ScanHistory />} />
              <Route path="/report/:id" element={<WebsiteReport />} />
              <Route path="/crawl-report" element={<CrawlReport />} />
              <Route path="/crawl-details/:id" element={<CrawlDetails />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="/export" element={<ExportReport />} />
              <Route path="/analytics" element={<Analytics />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
