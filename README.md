# TeamPulse - Private Team Task Management & Employee Check-In Platform

TeamPulse is a production-grade full-stack web application designed for high-efficiency internal team operations. It provides role-based task delegation, real-time presence/check-in tracking, milestone telemetry, and audit logs for teams.

---

## 🌟 Key Features

### 👑 Admin Experience
- **Centralized Dashboard**: Live statistics on total members, active personnel, today's check-ins, tasks breakdown (Pending, In Progress, Completed, Overdue), and weekly attendance charts.
- **Team Member Management**: Add new team members (enforced `MEMBER` role), edit profile info, activate/deactivate accounts, and perform one-click password resets.
- **Deactivation Integrity**: Deactivated members are prohibited from logging in, while all historical check-in timestamps, assigned tasks, and audit logs are preserved.
- **Task Delegation & Tracking**: Create and assign tasks with defined priorities (`Low`, `Medium`, `High`, `Urgent`), categories, and deadlines.
- **Attendance Monitoring**: Dedicated check-in tracking page with calendar date picker, member filter, status filter, and duration calculation.
- **Audit & Activity Logs**: Immutable chronological record of logins, check-ins, task creations, reassignments, and progress updates.
- **Analytics & Visualizations**: Interactive charts powered by Recharts for weekly check-in volume, task status breakdown, and priority metrics.
- **Customizable System Settings**: Configure team name, daily attendance threshold hours, and default timezone (`Asia/Kolkata` default).

### 👥 Member Experience
- **Real-Time Check-In Terminal**: Digital clock with one-click **Check In** and **Check Out** actions, shift completion badges, and daily attendance history.
- **Task Dashboard**: Personalized workspace displaying only tasks assigned to the member, categorized by `All`, `Today's Tasks`, `Upcoming`, `Completed`, and `Overdue`.
- **Interactive Progress Slider**: Granular progress control (0% to 100%) that automatically marks tasks as `Completed` when reaching 100%.
- **Task Updates & Comments Timeline**: Chronological milestone updates and delivery notes visible to both member and administrators.
- **Activity & Profile Management**: Personal activity stream, profile detail updates, and secure password changes.

### 🔒 Access Control & Security
- **Strict Role-Based Access Control (RBAC)**: Exactly two roles (`ADMIN` and `MEMBER`).
- **Private Registration**: No public signup. Only Admins can issue member accounts.
- **Zero Data Leakage**: Members cannot access Admin routes, Admin APIs, or view other members' private tasks.
- **Password Security**: Password hashing with `bcryptjs` (salt rounds = 10). Passwords are never returned in responses.
- **Token Security**: JWT-based session verification with Bearer tokens and HTTP-only cookie support.
- **API Defense**: Rate-limiting for authentication endpoints, Helmet security headers, CORS origin whitelisting, and Zod input validation.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, React Router v7, Axios, Lucide React, Recharts, date-fns |
| **Backend** | Node.js, Express.js, TypeScript, Prisma ORM, Socket.IO, Zod, bcryptjs, jsonwebtoken, Helmet, Morgan |
| **Database** | SQLite (zero-config local default) / PostgreSQL compatible |
| **Real-Time** | Socket.IO WebSockets for instant task, check-in, and notification broadcasts |

---

## 📁 Project Architecture

```
Taskforge/
├── package.json               # Monorepo development scripts
├── README.md                  # Complete documentation
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Prisma schema (User, Task, CheckIn, TaskUpdate, ActivityLog, Notification)
│   │   └── seed.ts            # Comprehensive seed script with demo accounts & sample tasks
│   ├── src/
│   │   ├── config/            # Server, JWT, and Prisma client configuration
│   │   ├── controllers/       # Auth, Members, Tasks, CheckIns, Dashboard, Activity, Settings
│   │   ├── middleware/        # Authentication, requireAdmin, requireMember, errorHandler
│   │   ├── routes/            # REST API route endpoints
│   │   ├── socket/            # Socket.IO initialization and real-time room dispatchers
│   │   ├── types/             # Backend TypeScript interfaces
│   │   ├── utils/             # JWT, Activity logger, and Date utilities
│   │   ├── validators/        # Zod request validation schemas
│   │   ├── app.ts             # Express application configuration & security
│   │   └── index.ts           # HTTP server and WebSocket entry point
│   ├── tsconfig.json
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/common/ # Reusable Button, Card, Modal, Badge, StatCard, ProgressBar, Skeleton, EmptyState, Header, Sidebar
    │   ├── context/           # AuthContext, NotificationContext, ToastContext
    │   ├── layouts/           # AdminLayout, MemberLayout
    │   ├── pages/
    │   │   ├── admin/         # AdminDashboardPage, MembersPage, MemberDetailPage, TasksPage, TaskDetailPage, CheckInsPage, ActivityPage, AnalyticsPage, SettingsPage
    │   │   ├── member/        # MemberDashboardPage, MemberTasksPage, MemberTaskDetailPage, MemberCheckInPage, MemberActivityPage, MemberProfilePage
    │   │   ├── auth/          # LoginPage (with quick-fill demo credentials)
    │   │   └── NotFoundPage.tsx
    │   ├── routes/            # AppRoutes with role-based routing guards
    │   ├── services/          # Axios API client and Socket.IO client
    │   ├── types/             # Frontend TypeScript interfaces
    │   ├── App.tsx
    │   ├── main.tsx
    │   └── index.css
    ├── tailwind.config.js
    ├── vite.config.ts
    ├── tsconfig.json
    └── package.json
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)

### 2. Environment Variables Setup

Create `.env` inside `backend/`:
```bash
cp backend/.env.example backend/.env
```

**`backend/.env` contents:**
```env
PORT=5000
DATABASE_URL="file:./dev.db"
JWT_SECRET="teampulse_super_secret_jwt_key_2026_secure_random"
FRONTEND_URL="http://localhost:5173"
NODE_ENV="development"
```

> **Note for PostgreSQL**: If you prefer PostgreSQL instead of SQLite, update `backend/prisma/schema.prisma` datasource provider to `postgresql` and set:
> `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/teampulse?schema=public"`

---

### 3. Database Initialization & Seeding

Run the following inside `backend/`:
```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:push
npm run prisma:seed
```

---

### 4. Running the Development Servers

#### Option A: Running from Root Monorepo
```bash
# In terminal 1 (Backend API):
npm run dev:backend

# In terminal 2 (Frontend Client):
npm run dev:frontend
```

#### Option B: Running Individually
```bash
# Start Backend (Port 5000):
cd backend
npm run dev

# Start Frontend (Port 5173):
cd frontend
npm run dev
```

Open **`http://localhost:5173`** in your browser to access TeamPulse!

---

## 🔑 Demo Credentials

| Role | Name | Email | Password |
|---|---|---|---|
| **System Admin** | System Admin | `admin@teampulse.local` | `Admin@123` |
| **Team Member** | Sakthi Vadivelan | `sakthi@example.com` | `Member@123` |
| **Team Member** | Naveen Kumar | `naveen@example.com` | `Member@123` |
| **Team Member** | Rahul Sharma | `rahul@example.com` | `Member@123` |

*(The login page includes convenient Quick-Fill buttons for instant one-click demo login).*

---

## 📡 REST API Reference Overview

### Authentication
- `POST /api/auth/login` — Sign in with email and password
- `POST /api/auth/logout` — Invalidate session and clear cookies
- `GET  /api/auth/me` — Retrieve active authenticated session
- `POST /api/auth/change-password` — Change password for authenticated user

### Members Management (Admin Only)
- `GET    /api/members` — List all members with today presence and active task stats
- `POST   /api/members` — Create a new member account (`MEMBER` role)
- `GET    /api/members/:id` — View full member profile, task history, and check-in logs
- `PUT    /api/members/:id` — Update member name, email, phone
- `PATCH  /api/members/:id/status` — Deactivate / Activate member
- `POST   /api/members/:id/reset-password` — Reset member password

### Tasks
- `GET   /api/tasks` — List tasks (Admin sees all; Member sees only assigned)
- `GET   /api/tasks/my` — Member shortcut for assigned tasks with filter tabs
- `POST  /api/tasks` — Admin creates and assigns a task
- `GET   /api/tasks/:id` — Retrieve task details with updates timeline
- `PUT   /api/tasks/:id` — Admin updates task metadata / reassigns member
- `PATCH /api/tasks/:id/progress` — Update progress (0-100%) and auto-complete
- `PATCH /api/tasks/:id/status` — Update task status
- `POST  /api/tasks/:id/comments` — Add milestone comment / progress entry

### Check-Ins & Attendance
- `POST /api/checkins/check-in` — Member check-in for the day
- `POST /api/checkins/check-out` — Member check-out
- `GET  /api/checkins/my` — Get member's today status & recent check-in history
- `GET  /api/checkins` — Admin attendance monitoring table with date/member/status filters

### Dashboard & Analytics
- `GET /api/dashboard/admin` — Admin metrics, charts, live member pulse, recent audit logs
- `GET /api/dashboard/member` — Member task counts, check-in widget, urgent tasks

### Activity & Notifications
- `GET   /api/activity` — System audit trail
- `GET   /api/notifications` — In-app notifications
- `PATCH /api/notifications/:id/read` — Mark notification read
- `PATCH /api/notifications/read-all` — Mark all notifications read

---

## 📦 Production Build

```bash
# Build backend TypeScript
cd backend
npm run build

# Build frontend production bundle
cd ../frontend
npm run build
```

---

## 🛡️ License
TeamPulse is released under the **MIT License**.