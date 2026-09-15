import { Route, Routes } from 'react-router-dom'
import NotFound from '../pages/NotFound.jsx'
import { AdminAuthProvider, RequireAdmin } from './AdminAuth.jsx'
import AdminLayout from './AdminLayout.jsx'
import AdminLogin from './AdminLogin.jsx'
import BookForm from './BookForm.jsx'
import Books from './Books.jsx'
import Categories from './Categories.jsx'
import Dashboard from './Dashboard.jsx'
import OrderDetail from './OrderDetail.jsx'
import Orders from './Orders.jsx'
import SellRequests from './SellRequests.jsx'

/** Everything under /admin. Loaded on demand so shoppers never download it. */
export default function AdminApp() {
  return (
    <Routes>
      <Route element={<AdminAuthProvider />}>
        <Route path="login" element={<AdminLogin />} />
        <Route element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
          <Route index element={<Dashboard />} />
          <Route path="orders" element={<Orders />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          <Route path="books" element={<Books />} />
          <Route path="books/new" element={<BookForm key="new" />} />
          <Route path="books/:id" element={<BookForm />} />
          <Route path="categories" element={<Categories />} />
          <Route path="sell-requests" element={<SellRequests />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  )
}
