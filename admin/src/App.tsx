import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Bookings from './pages/Bookings';
import Calendar from './pages/Calendar';
import Chalets from './pages/Chalets';
import Pricing from './pages/Pricing';
import BookingTypes from './pages/BookingTypes';
import BlackoutDates from './pages/BlackoutDates';
import Reports from './pages/Reports';
import AdminUsers from './pages/AdminUsers';
import Settings from './pages/Settings';
import AuditLog from './pages/AuditLog';
import Onboarding from './pages/Onboarding';
import { Toaster } from './components/ui';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function App() {
  return (
    <>
      <Toaster />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="chalets" element={<Chalets />} />
          <Route path="pricing" element={<Pricing />} />
          <Route path="booking-types" element={<BookingTypes />} />
          <Route path="blackout" element={<BlackoutDates />} />
          <Route path="reports" element={<Reports />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="audit-log" element={<AuditLog />} />
          <Route path="settings" element={<Settings />} />
          <Route path="onboarding" element={<Onboarding />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
