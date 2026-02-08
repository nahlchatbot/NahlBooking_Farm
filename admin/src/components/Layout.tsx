import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/auth';
import {
  LayoutDashboard,
  ClipboardList,
  CalendarDays,
  Home,
  DollarSign,
  CalendarX,
  BarChart2,
  Settings,
  LogOut,
  Menu,
  X,
  Globe,
  Users,
  Shield,
  Clock,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useState, Component, ErrorInfo, ReactNode } from 'react';

// Error Boundary to catch page-level crashes
interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackKey?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class PageErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Page crash:', error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (prevProps.fallbackKey !== this.props.fallbackKey) {
      this.setState({ hasError: false, error: undefined });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <div className="p-4 bg-red-100 rounded-full mb-4">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-sm text-gray-500 mb-4 max-w-md">
            {this.state.error?.message || 'An unexpected error occurred on this page.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

interface NavItem {
  path: string;
  icon: typeof LayoutDashboard;
  label: string;
  requireSuperAdmin?: boolean;
}

const navItems: NavItem[] = [
  { path: '/', icon: LayoutDashboard, label: 'sidebar.dashboard' },
  { path: '/bookings', icon: ClipboardList, label: 'sidebar.bookings' },
  { path: '/calendar', icon: CalendarDays, label: 'sidebar.calendar' },
  { path: '/chalets', icon: Home, label: 'sidebar.chalets' },
  { path: '/booking-types', icon: Clock, label: 'sidebar.bookingTypes' },
  { path: '/pricing', icon: DollarSign, label: 'sidebar.pricing' },
  { path: '/blackout', icon: CalendarX, label: 'sidebar.blackout' },
  { path: '/reports', icon: BarChart2, label: 'sidebar.reports' },
  { path: '/users', icon: Users, label: 'sidebar.users', requireSuperAdmin: true },
  { path: '/audit-log', icon: Shield, label: 'sidebar.auditLog', requireSuperAdmin: true },
  { path: '/settings', icon: Settings, label: 'sidebar.settings' },
];

export default function Layout() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 start-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 bg-white rounded-lg shadow-md"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 start-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 lg:translate-x-0 lg:rtl:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b">
            <h1 className="text-xl font-bold text-primary-700">
              {t('common.appName')}
            </h1>
            <p className="text-sm text-gray-500">{t('common.dashboard')}</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems
              .filter((item) => !item.requireSuperAdmin || user?.role === 'SUPER_ADMIN')
              .map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`
                  }
                >
                  <item.icon size={20} />
                  <span>{t(item.label)}</span>
                </NavLink>
              ))}
          </nav>

          {/* User section */}
          <div className="p-4 border-t">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-700 font-medium">
                  {user?.name?.charAt(0) || 'A'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{user?.name}</p>
                <p className="text-sm text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={toggleLanguage}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Globe size={16} />
                {t('common.language')}
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="lg:ms-64 min-h-screen">
        <div className="p-6">
          <PageErrorBoundary fallbackKey={location.pathname}>
            <Outlet />
          </PageErrorBoundary>
        </div>
      </main>
    </div>
  );
}
