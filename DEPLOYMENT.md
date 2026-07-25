# Deployment

## Frontend on Vercel

- Root directory: `apps/web`
- Build command: `npm run build --workspace apps/web`
- Environment variables:
  - `NEXT_PUBLIC_API_URL`
  - `NEXT_PUBLIC_GIFT_CARD_DEDUCTION_RATE`
  - `NEXT_PUBLIC_APP_NAME`
  - `NEXT_PUBLIC_BRAND_TAGLINE`
  - `NEXT_PUBLIC_LOGO_URL`
  - `NEXT_PUBLIC_RAZORPAY_KEY`
  - `NEXT_PUBLIC_CAPTCHA_SITE_KEY`

## Backend on Render

- Root directory: `apps/api`
- Build command: `npm install && npm run prisma:generate && npm run build`
- Start command: `npm run prisma:deploy && npm run start`
- Health check: `GET /health`
- Environment variables:
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `ENCRYPTION_SECRET`
  - `FRONTEND_URL`
  - `REDIS_URL`
  - `GIFT_CARD_DEDUCTION_RATE`
  - `BRAND_NAME`
  - `BRAND_LOGO_URL`
  - `BRAND_TAGLINE`
  - `OTP_BYPASS_CODE`

## Database

- Primary database: PostgreSQL on Render
- Prisma schema: `apps/api/prisma/schema.prisma`
- Run migrations on deploy with `npm run prisma:deploy` (or `npx prisma db push`)
- CSV snapshots are exported from `GET /api/admin/export-csv`

## Environment

- Copy `.env.example` to `.env` locally and fill in real values.
- Keep `.env` out of git.
- All frontend API calls must use `NEXT_PUBLIC_API_URL`.

## Notes

- The UI is designed for a white background with purple/gold primary actions.
- PAN verification and card delivery are handled as separate post-checkout steps.
- The CSV export uses the same Prisma field names as the PostgreSQL models.

