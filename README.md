# Obsidian Suits: luxury suits e-commerce platform

Next.js 14 (App Router) · TypeScript · Tailwind · Framer Motion · Zustand · TanStack Query · MongoDB (Mongoose) · NextAuth (JWT + RBAC) · Razorpay · Cloudinary · Upstash rate limiting.

## Quick start

```bash
npm install
cp .env.example .env.local      # fill in the values (see below)
npm run seed                    # creates admin user, 8 sample products, banner, OBSIDIAN coupon
npm run dev                     # http://localhost:3000
```

Admin: `http://localhost:3000/login` → sign in with the seeded admin (`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`) → `/admin`.
**Change the seed password before deploying.**

## Services you need

| Service | What to do |
|---|---|
| **MongoDB** | Local instance or MongoDB Atlas. Set `MONGODB_URI`. |
| **Razorpay** | Dashboard → API keys → set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`. Then Webhooks → add `https://YOUR_DOMAIN/api/webhooks/razorpay`, events `payment.captured`, `order.paid`, `payment.failed`, and put the secret in `RAZORPAY_WEBHOOK_SECRET`. |
| **Cloudinary** | Set `CLOUDINARY_*` and `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`. Uploads are signed server-side and go straight from the browser to Cloudinary. |
| **Upstash Redis** (optional) | Set the two `UPSTASH_*` vars for distributed rate limiting. Without them an in-memory limiter is used (fine for dev, weak on serverless). |
| **SMTP** (optional) | Set `SMTP_*` to email receipts. Without it, receipts are logged to the console. |

`NEXTAUTH_SECRET`: generate with `openssl rand -base64 32`.

## Project structure

```
src/
  app/
    page.tsx, shop/, product/[slug]/, checkout/, order-success/, track-order/, login/, register/
    admin/            dashboard, products, inventory, orders (+[id] invoice), marketing
    api/
      auth/           NextAuth + register
      products, announcement, coupons/validate, track-order     (public)
      checkout/create-order, checkout/verify, webhooks/razorpay  (payments)
      admin/*         products CRUD, upload-sign, inventory, orders, stats, marketing  (admin only)
    sitemap.ts, robots.ts
  components/         AnnouncementBar, Header, CartDrawer, ProductCard, ProductGallery,
                      ProductPurchase, SizeGuideModal, JsonLd, admin/ProductForm
  lib/                db, auth (+requireAdmin), pricing, payments, razorpay, cloudinary,
                      rate-limit, mail, schemas, utils
  models/             Product, Order, Marketing, User
  store/cart.ts       Zustand cart (persisted)
  middleware.ts       RBAC gate for /admin
scripts/seed.ts
```

## How payments work

1. `POST /api/checkout/create-order`: validates input, **re-prices the cart on the server** from MongoDB (client prices are never trusted), checks stock, applies the coupon, creates a Razorpay order (amount in paise) and a `PENDING` order in MongoDB.
2. Razorpay Checkout opens in the browser. On success the handler calls `POST /api/checkout/verify`, which checks `HMAC-SHA256(order_id|payment_id)` (timing-safe).
3. `POST /api/webhooks/razorpay` verifies `x-razorpay-signature` over the raw body as a backup (covers closed tabs and network drops).
4. Both paths call `markOrderPaid()`: an atomic non-`PAID` → `PAID` update, so whichever arrives first wins and stock is decremented **exactly once**. It also bumps `totalSold`, adds a timeline entry and sends the receipt.

## Security notes

- `/admin` is gated by middleware **and** a server-side check in the admin layout; every `/api/admin/*` route calls `requireAdmin()`.
- Registration always creates `role: "user"`. Admins are created only via the seed script.
- Public order tracking needs order ID **plus** matching phone/email, returns an identical error for either mismatch, and is rate limited.
- Passwords: bcrypt (cost 12). Sessions: JWT, 7 days.

## Business-rule assumptions (edit in `.env`)

- Prices are **GST-inclusive** (`GST_RATE`, default 12%); the invoice shows the embedded tax.
- Free shipping at ₹9,999 (`FREE_SHIPPING_THRESHOLD`), otherwise ₹499 (`SHIPPING_FEE`). The cart drawer and checkout UI currently use these defaults as constants. If you change the env values, also update `FREE_SHIPPING` in `CartDrawer.tsx` and `checkout/page.tsx`.
- Stock is decremented on payment confirmation, not at order creation, so two buyers can briefly both pay for the last unit. A `/verify` or webhook race for oversold stock would need a manual refund. Add stock reservation if you expect high concurrency.
- Orders with unpaid (`PENDING`/`FAILED`) payment status are hidden from the admin order list and public tracking.

## Deploy to Vercel

1. Push to GitHub, import in Vercel, add all env vars from `.env.example` (set `NEXTAUTH_URL` and `NEXT_PUBLIC_SITE_URL` to your production URL).
2. Run `npm run seed` once locally against the production `MONGODB_URI` (or create your admin another way).
3. Add the Razorpay webhook (above) pointing to your production domain.
4. Allow Vercel's IPs in MongoDB Atlas network access (or `0.0.0.0/0` with a strong password).

## Not included / next steps

- Seed images are Unsplash placeholders. Replace them with your own via the admin Cloudinary uploader.
- Refund flow, password reset, email verification and a reviews system are not implemented.
- No automated test suite is included. `npm run typecheck` and `npm run build` pass.
- Lighthouse 95+ scores depend on your real images and hosting; the code uses `next/image` with AVIF/WebP, explicit aspect ratios, font swap, ISR and semantic markup to support that, but I haven't run Lighthouse against a live deployment.
