# Roadmap: what Second Shelf still needs

Work top to bottom. Tick a box when it's done, and add a line under the item if the plan changes.

Already done: central access guard in `E-commerce/api/bootstrap.php`. Endpoints not listed there are admin-only by default.

## P1: Must fix (security and money)

- [x] **Limit login attempts** in `api/auth.php` and `api/admin_auth.php`
  - Problem: there's no limit on password guesses.
  - Plan: add a `login_attempts` table (email + IP + time). After 5 failures in 15 minutes, return 429.
- [x] **Add a Razorpay webhook** (new `api/razorpay_webhook.php`)
  - Problem: an order is only marked paid when the browser calls `verify_payment.php`. If the customer closes the tab, they're charged but the order stays unpaid.
  - Plan: verify the `X-Razorpay-Signature` header against a webhook secret in `secrets.php`, then mark the order paid. Running it twice must be harmless. Add the file to `PUBLIC_ENDPOINTS`.
- [x] **Move the database login out of the code**
  - Problem: `config.php` hardcodes `root` with an empty password.
  - Plan: read DB host, name, user and password from `secrets.php` (update `secrets.example.php` too), and create a database user that only has rights on `e-commerce`.

## P2: Needed before going live

- [x] **CSRF protection**
  - Problem: the only protection is the SameSite=Lax cookie, and `body()` accepts any Content-Type.
  - Plan: reject write requests (POST/PATCH/DELETE) whose `Content-Type` isn't `application/json` or `multipart/form-data`, and check the `Origin` header in `bootstrap.php`.
- [x] **Mark the session cookie `secure` on HTTPS**
  - Plan: add `'secure' => !empty($_SERVER['HTTPS'])` to `session_set_cookie_params`.
  - Note: this only detects HTTPS handled by Apache itself. Behind a proxy, `X-Forwarded-Proto` also needs checking.
- [x] **Password reset**
  - Plan: a "forgot password" form emails a one-time link (hashed token with an expiry, stored in a new table), and the link leads to a page that sets a new password.
- [x] **Email verification**
  - Plan: send a link after sign-up. Decide whether unverified users can still place orders.
  - Decision: unverified customers can sign in and browse, but can't place orders. Accounts created before migration 003 count as verified.
- [x] **Real email delivery**
  - Problem: XAMPP's `mail()` isn't set up, so emails (and their links) only go to the PHP error log.
  - Plan: configure `mail()`/sendmail or an SMTP service before going live, then remove the log fallback.
  - Done: a small SMTP client in `bootstrap.php`, set up with the `smtp_*` settings in `secrets.php` (Gmail App Password works). The log fallback stays only for when no SMTP server is set (local dev). Make sure `smtp_host` is set on a live server.

## P3: Quality

- [ ] **Tests**
  - Plan: start with one small PHP script that calls the API endpoints and checks the guards, cart totals and order flow. Add a framework only if this grows.
- [ ] **Linting**
  - Plan: add ESLint with the React plugin to `frontend`, plus a `lint` script in `package.json`.
- [ ] **Track which migrations have run**
  - Plan: a `schema_migrations` table and a small `database/migrate.php` that only runs new `.sql` files.

## Later / nice to have

- [ ] Admin activity log (who changed which order or book)
- [ ] Order confirmation emails
- [ ] Customer reviews or ratings on books
- [ ] Deployment guide (HTTPS, production `secrets.php`, `npm run build`)
