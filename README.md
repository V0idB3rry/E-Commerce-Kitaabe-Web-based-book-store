This is a ecommerece site for buying and selling books 
this is just a project for college and not ready to deploy

## Second Shelf (new storefront)

| Folder | What it is |
| --- | --- |
| `E-commerce/frontend` | React app (Vite) |
| `E-commerce/api` | PHP JSON API used by the React app |
| `E-commerce/uploads/books` | Book cover images |
| `E-commerce/database` | Schema and migrations (see its README) |

### Run it

1. Start **Apache** and **MySQL** in the XAMPP Control Panel and set up the database (`E-commerce/database/README.md`).
2. Razorpay test keys: copy `E-commerce/api/secrets.example.php` to `secrets.php` and fill them in (cash on delivery works without them).
3. Then either:
   - **While developing:** `cd E-commerce/frontend`, `npm install`, `npm run dev` → open http://localhost:5173
   - **Without npm running:** `npm run build` once, then open
     http://localhost/E-Commerce-Kitaabe-Web-based-book-store/E-commerce/frontend/dist/

Customers must create a new account; accounts from the old site stored plain-text passwords and can't sign in.
