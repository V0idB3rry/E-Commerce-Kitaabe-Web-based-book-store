import { createContext, useCallback, useContext, useState } from 'react'
import Icon from '../components/Icons.jsx'

const ToastContext = createContext(() => {})

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((message, { type = 'success', action } = {}) => {
    const id = Date.now() + Math.random()
    setToasts((list) => [...list.slice(-2), { id, message, type, action }])
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 3500)
  }, [])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            <Icon name={t.type === 'error' ? 'close' : 'check'} size={18} />
            <span>{t.message}</span>
            {t.action}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
