// ========================================
// Toast Notification Component
// ========================================
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import './ToastContainer.css';

const ICONS = {
  success: <CheckCircle size={16} />,
  error: <AlertCircle size={16} />,
  info: <Info size={16} />,
};

export default function ToastContainer() {
  const { toasts } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast--${toast.type || 'info'}`}
        >
          <span className="toast__icon">{ICONS[toast.type] || ICONS.info}</span>
          <span className="toast__message">{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
