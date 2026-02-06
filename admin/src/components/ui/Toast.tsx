import { Toaster as HotToaster, toast as hotToast } from 'react-hot-toast';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export function Toaster() {
  return (
    <HotToaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#fff',
          color: '#1f2937',
          padding: '16px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          maxWidth: '400px',
        },
        success: {
          iconTheme: {
            primary: '#22c55e',
            secondary: '#fff',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: '#fff',
          },
        },
      }}
    />
  );
}

interface ToastOptions {
  description?: string;
  duration?: number;
}

export const toast = {
  success: (message: string, options?: ToastOptions) => {
    hotToast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? 'animate-slide-down' : 'opacity-0'
          } flex items-start gap-3 bg-white p-4 rounded-xl shadow-elevated border border-green-100`}
        >
          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900">{message}</p>
            {options?.description && (
              <p className="mt-1 text-sm text-gray-500">{options.description}</p>
            )}
          </div>
          <button
            onClick={() => hotToast.dismiss(t.id)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ),
      { duration: options?.duration || 4000 }
    );
  },

  error: (message: string, options?: ToastOptions) => {
    hotToast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? 'animate-slide-down' : 'opacity-0'
          } flex items-start gap-3 bg-white p-4 rounded-xl shadow-elevated border border-red-100`}
        >
          <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900">{message}</p>
            {options?.description && (
              <p className="mt-1 text-sm text-gray-500">{options.description}</p>
            )}
          </div>
          <button
            onClick={() => hotToast.dismiss(t.id)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ),
      { duration: options?.duration || 5000 }
    );
  },

  warning: (message: string, options?: ToastOptions) => {
    hotToast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? 'animate-slide-down' : 'opacity-0'
          } flex items-start gap-3 bg-white p-4 rounded-xl shadow-elevated border border-yellow-100`}
        >
          <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900">{message}</p>
            {options?.description && (
              <p className="mt-1 text-sm text-gray-500">{options.description}</p>
            )}
          </div>
          <button
            onClick={() => hotToast.dismiss(t.id)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ),
      { duration: options?.duration || 4000 }
    );
  },

  info: (message: string, options?: ToastOptions) => {
    hotToast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? 'animate-slide-down' : 'opacity-0'
          } flex items-start gap-3 bg-white p-4 rounded-xl shadow-elevated border border-blue-100`}
        >
          <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900">{message}</p>
            {options?.description && (
              <p className="mt-1 text-sm text-gray-500">{options.description}</p>
            )}
          </div>
          <button
            onClick={() => hotToast.dismiss(t.id)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ),
      { duration: options?.duration || 4000 }
    );
  },

  loading: (message: string) => {
    return hotToast.loading(message);
  },

  dismiss: (id?: string) => {
    hotToast.dismiss(id);
  },
};
