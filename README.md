# 🌿 FreshRoots Market

A full-stack online fresh produce delivery & pickup platform built with **React + Vite** (frontend) and **Node.js + Express + SQLite** (backend).

## Features

- 🛒 Browse & search fresh produce with category filters
- 🛍️ Cart management with quantity controls
- 🚚 Checkout with **Home Delivery** (time slots) or **In-Store Pickup** (scheduled time)
- 📦 Real-time order status tracking with visual progress stepper
- 👤 Customer authentication (register/login)
- 🔑 Admin dashboard: inventory management (CRUD) + order status updates + stats
- 🎨 Premium dark theme with Sage Green palette, glassmorphism, and micro-animations

## Default Accounts

| Role     | Username | Password  |
|----------|----------|-----------|
| Admin    | admin    | admin123  |
| Customer | john     | john123   |

## Quick Start

```bash
# 1. Install all dependencies
npm run bootstrap

# 2. Start both servers concurrently
npm run dev
```

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## Project Structure

```
├── client/          # React + Vite frontend
│   └── src/
│       ├── App.jsx       # Full UI application
│       └── index.css     # Design system & styles
└── server/          # Express + SQLite backend
    ├── server.js         # REST API routes
    ├── database.js       # DB connection & seed data
    └── schema.sql        # Database schema
```

## API Endpoints

| Method | Path                       | Auth     | Description              |
|--------|----------------------------|----------|--------------------------|
| POST   | /api/auth/register         | Public   | Create account           |
| POST   | /api/auth/login            | Public   | Sign in                  |
| GET    | /api/products              | Public   | List/search products     |
| POST   | /api/products              | Admin    | Add product              |
| PUT    | /api/products/:id          | Admin    | Update product           |
| DELETE | /api/products/:id          | Admin    | Delete product           |
| GET    | /api/orders                | Auth     | Get orders               |
| POST   | /api/orders                | Auth     | Place order              |
| PUT    | /api/orders/:id/status     | Admin    | Update order status      |
| GET    | /api/admin/stats           | Admin    | Dashboard stats          |
