# API Overview

Base URL: `/api`

The API is built for a no-KYC, custom-amount prepaid card marketplace with white-label branding.

## Meta

- `GET /meta/brand`

## Auth

- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/forgot-password`
- `POST /auth/verify-email`
- `POST /auth/otp/request`
- `POST /auth/otp/verify`
- `GET /auth/me`

## Catalog

- `GET /products`
- `GET /products/:slug`
- `GET /products/featured/list`

## Cart and Wishlist

- `GET /cart`
- `POST /cart/items`
- `PATCH /cart/items/:id`
- `DELETE /cart/items/:id`
- `GET /wishlist`
- `POST /wishlist/:productId`
- `DELETE /wishlist/:productId`

## Checkout and Orders

- `POST /checkout/session`
- `POST /checkout/webhook`
- `GET /orders`
- `GET /orders/:id`

## Cards and Dashboard

- `GET /cards`
- `POST /cards/:id/reveal`
- `GET /dashboard/summary`
- `GET /notifications`

## Notes

- Card amounts are validated in the purchase flow; there are no preset tiers.
- Reveal actions are rate limited and logged.
- Webhook verification is required before issuing cards.

## Admin

- `GET /admin/overview`
- `GET /admin/users`
- `GET /admin/orders`
- `PATCH /admin/products/:id/status`

