# Worthy Waste (HTML/CSS/JS + Node.js + MongoDB)

A lightweight implementation of the Worthy Waste platform using vanilla HTML, CSS, and JS on the frontend, and Node.js + Express + MongoDB on the backend.

## Features

- Landing Page with live counters and hero CTA
- Supplier Dashboard: add waste with photo, view history, Eco Score badge
- Buyer Dashboard: browse listings with filters, Book Pickup, see bookings with status tracker (Requested → Confirmed → Picked → Completed)
- Analytics Page: counters, status breakdown, leaderboard

## Tech Stack

- Frontend: HTML + CSS + vanilla JS served from `public/`
- Backend: Node.js + Express
- Database: MongoDB (official driver)
- File uploads: multer (stored in `uploads/`)

## Project Structure

- `server.js` — Express server and API routes
- `public/` — Static frontend
  - `index.html`, `supplier.html`, `buyer.html`, `analytics.html`
  - `styles.css`, `app.js`
- `uploads/` — Uploaded images (auto-created)
- `.env.example` — Environment template

## Setup

1) Install Node.js 18+ and MongoDB (local) or have a MongoDB Atlas URI.

2) Create `.env` from template and edit if needed:

```powershell
Copy-Item .env.example .env
```

3) Install dependencies:

```powershell
npm install
```

4) Start the server (dev):

```powershell
npm run dev
```

Or start normally:

```powershell
npm start
```

5) Open in your browser:

- http://localhost:3000/
- http://localhost:3000/supplier
- http://localhost:3000/buyer
- http://localhost:3000/analytics

## Environment Variables

- `MONGODB_URI` — e.g., `mongodb://127.0.0.1:27017` or an Atlas URI
- `DB_NAME` — default `worthywaste`
- `PORT` — default `3000`

## API Overview

- `GET /api/health` — health check
- `POST /api/waste` — add waste (multipart form with fields: `supplier`, `type`, `weight`, `location`, optional `photo`)
- `GET /api/waste?supplier=NAME` — list wastes (optionally filter by supplier)
- `GET /api/listings?location=...&minWeight=...&maxWeight=...` — available listings for buyers
- `POST /api/bookings` — create a booking (`{ wasteId, buyer }`)
- `GET /api/bookings?buyer=NAME` — list bookings (optionally filter by buyer)
- `PATCH /api/bookings/:id/status` — update booking status (`Requested|Confirmed|Picked|Completed`)
- `GET /api/counters` — live counters (waste saved, compost produced, CO₂ reduced)
- `GET /api/leaderboard` — top suppliers by completed kg
- `GET /api/analytics` — status breakdown

## Notes

- This project stores uploaded photos to the local `uploads/` folder and serves them at `/uploads/...`.
- For production, consider using cloud storage and adding auth/validation.
