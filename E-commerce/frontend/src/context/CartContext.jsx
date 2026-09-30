import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { api } from '../api.js'
import { useAuth } from './AuthContext.jsx'
import { useToast } from './ToastContext.jsx'

const EMPTY = {
  items: [],
  totals: { count: 0, cover_total: 0, subtotal: 0, savings: 0, delivery_fee: 0, total: 0, free_delivery_above: 499, standard_fee: 40 },
}

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const { user } = useAuth()
  const [cart, setCart] = useState(EMPTY)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!user) {
      setCart(EMPTY)
      return
    }
    setLoading(true)
    try {
      setCart(await api('cart.php'))
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    refresh().catch(() => setCart(EMPTY))
  }, [refresh])

  const add = useCallback(async (productId, quantity = 1) => {
    setCart(await api('cart.php', { method: 'POST', body: { product_id: productId, quantity } }))
  }, [])

  const setQuantity = useCallback(async (productId, quantity) => {
    setCart(await api('cart.php', { method: 'PATCH', body: { product_id: productId, quantity } }))
  }, [])

  const remove = useCallback(async (productId) => {
    setCart(await api('cart.php', { method: 'DELETE', params: { product_id: productId } }))
  }, [])

  const value = useMemo(
    () => ({ ...cart, loading, refresh, add, setQuantity, remove }),
    [cart, loading, refresh, add, setQuantity, remove]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  return useContext(CartContext)
}

/**
 * Add-to-cart with the shared behaviour: send guests to sign in (and back),
 * show a toast, and report stock errors.
 */
export function useAddToCart() {
  const { user } = useAuth()
  const { add } = useCart()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  return useCallback(
    async (book, quantity = 1, { quiet = false } = {}) => {
      if (!user) {
        navigate(`/signin?next=${encodeURIComponent(location.pathname + location.search)}`, {
          state: { reason: 'Sign in to add books to your cart.' },
        })
        return false
      }
      try {
        await add(book.id, quantity)
        if (!quiet) {
          toast(`“${book.title}” added to your cart`, { action: <Link to="/cart">View cart</Link> })
        }
        return true
      } catch (error) {
        toast(error.message, { type: 'error' })
        return false
      }
    },
    [user, add, toast, navigate, location]
  )
}
