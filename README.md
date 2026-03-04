# RAYHAAN RAFFLES

Production-ready starter for a Dubai-based raffle/lotto web app with:
- Public front-end raffle listing and checkout flow
- Admin panel for core metrics and ticket monitoring
- AED-first currency handling
- Payment gateway routing:
  - **Razorpay** for India (`countryCode=IN`)
  - **Stripe** for all other countries

## Tech stack
- Node.js + Express + EJS
- SQLite (`better-sqlite3`) for local persistence
- Stripe + Razorpay SDK integrations

## Features included
- Seeded raffles (house, car, luxury gifts)
- Ticket number generation (`RR-<raffleId>-<random>`)
- Checkout API (`POST /checkout`) creating:
  - user
  - ticket
  - gateway order/payment intent
  - payment record
- Admin dashboard (`/admin`) with sales and ticket overview

## Setup
```bash
npm install
cp .env.example .env
npm run dev
```
Then open http://localhost:3000

## Payment integration notes
This template creates gateway orders/payment intents server-side.
To complete live card flows, add front-end SDK confirm steps:
- Stripe.js using returned `clientSecret`
- Razorpay Checkout using returned `orderId`

## API sample
```bash
curl -X POST http://localhost:3000/checkout \
  -H "Content-Type: application/json" \
  -d '{"raffleId":1,"name":"Aisha Khan","email":"aisha@example.com","countryCode":"AE"}'
```

## Important legal/compliance reminder
Real-money raffles in UAE/India/other jurisdictions need legal approval, licensing, KYC/AML, and responsible-gaming controls.
