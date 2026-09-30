import { Suspense, lazy, useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { RequireAuth, ScrollManager, StoreLayout } from './components/Layouts.jsx'
import Account from './pages/Account.jsx'
import BookDetail from './pages/BookDetail.jsx'
import Cart from './pages/Cart.jsx'
import Catalog from './pages/Catalog.jsx'
import Categories from './pages/Categories.jsx'
import Checkout from './pages/Checkout.jsx'
import Home from './pages/Home.jsx'
import NotFound from './pages/NotFound.jsx'
import OrderConfirmation from './pages/OrderConfirmation.jsx'
import SellBooks from './pages/SellBooks.jsx'
import SignIn from './pages/SignIn.jsx'

const AdminApp = lazy(() => import('./admin/AdminApp.jsx'))

const TITLES = {
  '/': 'Second Shelf · Old books, new beginnings',
  '/shop': 'Shop · Second Shelf',
  '/categories': 'Categories · Second Shelf',
  '/cart': 'Your cart · Second Shelf',
  '/checkout': 'Checkout · Second Shelf',
  '/signin': 'Sign in · Second Shelf',
  '/signup': 'Create account · Second Shelf',
  '/account': 'Your account · Second Shelf',
  '/sell': 'Sell your books · Second Shelf',
}

function DocumentTitle() {
  const { pathname } = useLocation()
  useEffect(() => {
    // Book pages set their own title
    if (TITLES[pathname]) document.title = TITLES[pathname]
  }, [pathname])
  return null
}

export default function App() {
  return (
    <>
      <ScrollManager />
      <DocumentTitle />
      <Routes>
        <Route element={<StoreLayout />}>
          <Route index element={<Home />} />
          <Route path="shop" element={<Catalog />} />
          <Route path="categories" element={<Categories />} />
          <Route path="books/:id" element={<BookDetail />} />
          <Route path="cart" element={<Cart />} />
          <Route path="sell" element={<SellBooks />} />
          <Route path="account" element={<RequireAuth><Account /></RequireAuth>} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="checkout" element={<RequireAuth><Checkout /></RequireAuth>} />
        <Route path="orders/:id" element={<RequireAuth><OrderConfirmation /></RequireAuth>} />
        <Route path="signin" element={<SignIn mode="signin" />} />
        <Route path="signup" element={<SignIn mode="signup" />} />
        <Route
          path="admin/*"
          element={
            <Suspense fallback={<div className="loading">Loading admin…</div>}>
              <AdminApp />
            </Suspense>
          }
        />
      </Routes>
    </>
  )
}
