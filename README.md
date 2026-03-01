# Logistics Shipment Booking & Tracking System

A full-stack logistics platform enabling shippers to search carrier services, create multi-leg shipment bookings with snapshotted pricing, and track shipments through their complete lifecycle.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js 18 + Vite |
| Backend | Node.js + Express |
| Database | MySQL 8.x |
| ORM | Sequelize v6 |
| Validation | Joi |

## Architecture

### Service Boundaries

- **Carrier Catalogue Service** — Manages carrier groups and their services. Supports search, filter, sort, and pagination.
- **Shipment Service** — Manages shipment lifecycle from DRAFT through CLOSED, including multi-leg routing, pricing snapshots, and exception handling.

### Key Design Decisions

1. **Single-Carrier Enforcement**: Enforced at both service layer (validation on add-leg) and database level (`carrier_group_id` FK on shipments).

2. **Optimistic Locking**: Uses a `version` integer column on shipments. Every update requires the current version; stale writes receive HTTP 409 Conflict.

3. **Idempotent Submission**: Clients send an `Idempotency-Key` header. The server stores the key and response. Duplicate requests return the cached response without creating duplicate records.

4. **Pricing Snapshots**: While in DRAFT, legs reflect live carrier pricing. On submission, prices are snapshotted and become immutable regardless of future carrier rate changes.

5. **Shipment Number Generation**: Format `SHP-YYYYMMDD-XXXXX` using the date and zero-padded shipment ID.

6. **State Machine**: `DRAFT → BOOKED → IN_TRANSIT → DELIVERED → CLOSED` with `EXCEPTION` branch. Transitions enforced via a whitelist map. Exception requires `reason_code` and cannot proceed without explicit resolution.

7. **Capacity Validation**: Shipment weight/volume validated against each carrier service's `max_weight_kg` and `max_volume_cbm` before adding legs and on submission.

### Trade-offs & Assumptions

- **No authentication**: The system does not implement user authentication. In production, JWT or session-based auth would be required.
- **Sequelize `sync({ alter: true })`**: Used in development for convenience. In production, use explicit migrations.
- **In-memory idempotency**: Stored in MySQL with TTL. A Redis-based approach would be more performant at scale.
- **Single database**: Both services share the same MySQL instance. In a microservices architecture, each would have its own database.

### Known Limitations

- No WebSocket/SSE for real-time tracking updates
- No file upload for shipping documents
- No email notifications
- Pagination is basic offset-based (cursor-based would be better for large datasets)

## Getting Started

### Prerequisites

- Node.js 18+
- MySQL 8.x

### Database Setup

```sql
CREATE DATABASE IF NOT EXISTS logistics_db;
```

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your MySQL credentials
npm install
npm run dev
```

The backend starts on `http://localhost:5000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend starts on `http://localhost:3000` with API proxy to backend.

## API Endpoints

### Carrier Catalogue

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/carriers | List carrier groups |
| GET | /api/carriers/:id | Get carrier group |
| GET | /api/carriers/:id/services | List services for carrier |
| GET | /api/services | Search/filter/sort/paginate services |
| GET | /api/services/:id | Get service detail |

### Shipment Service

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/shipments | Create draft |
| GET | /api/shipments | List with filters |
| GET | /api/shipments/:id | Get detail |
| PUT | /api/shipments/:id | Update draft |
| POST | /api/shipments/:id/legs | Add leg |
| PUT | /api/shipments/:id/legs/:legId | Update leg |
| DELETE | /api/shipments/:id/legs/:legId | Remove leg |
| POST | /api/shipments/:id/submit | Submit (idempotent) |
| PATCH | /api/shipments/:id/status | Transition status |
| POST | /api/shipments/:id/exception | Record exception |
| POST | /api/shipments/:id/resolve-exception | Resolve exception |

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── config/database.js
│   │   ├── middleware/ (errorHandler, validate, idempotency)
│   │   ├── models/ (6 Sequelize models + index.js)
│   │   ├── routes/ (carrierRoutes, shipmentRoutes)
│   │   ├── services/ (carrierService, shipmentService)
│   │   ├── validators/ (Joi schemas)
│   │   ├── utils/ (shipmentNumberGenerator)
│   │   ├── seeders/ (carrierSeeder)
│   │   ├── app.js
│   │   └── server.js
│   └── openapi.yaml
├── frontend/
│   ├── src/
│   │   ├── api/apiClient.js
│   │   ├── context/BookingContext.jsx
│   │   ├── hooks/useDebounce.js
│   │   ├── pages/ (4 pages)
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   └── vite.config.js
└── README.md
```
