# TransitOps — Smart Transport Operations Platform

TransitOps is a full-stack MERN application built to digitize transport operations — vehicle registry, driver management, trip dispatch, maintenance workflows, fuel & expense tracking, and analytics — with strict role-based access control (RBAC) and automated business rule enforcement.

Built as part of an 8-hour hackathon.

## Team

| Name | Role |
|---|---|
| **Kaushal Patel** | Team Leader |
| Nitin Gami | Team Member |
| Parth Ravariya | Team Member |
| Ravindra Arethiya | Team Member |

## Tech Stack

- **Frontend:** React (Vite), Tailwind CSS, React Router, Recharts, Socket.IO Client
- **Backend:** Node.js, Express.js
- **Database:** MongoDB with Mongoose
- **Auth:** JWT with Role-Based Access Control (RBAC) and account lockout after failed login attempts
- **Real-time:** Socket.IO for live dashboard/trip/vehicle updates
- **Exports:** CSV and PDF export (jsPDF + autotable)

## User Roles

- **Fleet Manager** — Full access to Fleet, Drivers, Maintenance
- **Dispatcher** — Manages Trips, views Fleet/Drivers/Fuel
- **Safety Officer** — Manages Drivers, compliance, license/safety tracking
- **Financial Analyst** — Full access to Fuel/Expenses and Analytics

## Core Features

- Secure authentication with RBAC and account lockout after 5 failed login attempts
- Vehicle Registry with unique registration number enforcement
- Driver Management with license expiry and suspension tracking
- Trip Dispatcher with full lifecycle: Draft → Dispatched → Completed → Cancelled
- Automatic status transitions (vehicle/driver → On Trip, In Shop, Available)
- Business rule validation (cargo weight vs. capacity, expired license blocking, duplicate dispatch prevention)
- Maintenance workflow with automatic vehicle status management
- Fuel & Expense tracking with auto-computed operational cost
- Dashboard KPIs and Reports & Analytics (fuel efficiency, ROI, utilization, top costliest vehicles)
- Real-time updates via Socket.IO
- CSV/PDF export across modules

## Project Structure

```
transitops/
├── backend/
│   ├── config/          # DB connection
│   ├── models/           # Mongoose schemas
│   ├── controllers/      # Route logic
│   ├── routes/            # Express routers
│   ├── middleware/       # Auth & RBAC middleware
│   ├── socket/             # Socket.IO setup
│   ├── utils/              # Helpers (token, trip code, socket emitters)
│   ├── seed/               # Database seeding script
│   └── server.js
└── frontend/
    ├── src/
    │   ├── api/            # Axios instance
    │   ├── components/  # Shared UI components
    │   ├── context/       # Auth, Socket, Toast providers
    │   ├── pages/          # Route-level pages
    │   └── utils/          # Formatters, export helpers
    └── index.html
```

## Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (local or Atlas)

### Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/transitops
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=1d
MAX_LOGIN_ATTEMPTS=5
LOCK_TIME_MINUTES=15
```

Run the server:
```bash
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`, API at `http://localhost:5000`.

## Environment URLs

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000/api |
| Health Check | http://localhost:5000/api/health |

## License

Built for hackathon/educational purposes.
