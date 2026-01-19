# QTrack - QR-Based Warehouse & Material Tracking Application

QR-code-driven warehouse and material tracking application for QC workflow and inventory visibility.

## Project Structure

```
QTrack/
├── mobile/              # React Native (Expo) mobile app
├── backend/             # Node.js/Express API
├── database/            # SQL schema + seed
├── flow.md              # Process flow (high level)
└── README.md
```

## Core Flow

```
Quarantine → Under Test → Approved/Rejected → Dispensed
```

## Prerequisites

- Node.js 20.19.4+ (recommended)
- PostgreSQL 14+
- Expo Go (iOS/Android)

## Setup (Local)

### 1) Database

Create the database and run migrations:

```bash
cd backend
npm run migrate
```

### 2) Backend

Update `backend/.env`:

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=QTrack
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=change_this
```

Start API:

```bash
cd backend
npm run dev
```

Health check:

```
http://localhost:3000/health
```

### 3) Mobile App

Update API base URL:

- `mobile/src/config/api.js`
- Use your IP for physical device testing

Example:

```
http://YOUR_IP:3000/api
```

Install and start:

```bash
cd mobile
npm install
npm start
```

Scan QR code using Expo Go or iOS Camera app.

## Test Users

- `operator1` / `test123`
- `viewer1` / `test123`

## Testing

Backend:
```bash
curl http://localhost:3000/health
```

Mobile:
- Login
- Scan QR
- Create material (Operator only)

## Notes

- If Expo says port 8081 is busy, free it or use 8082.
- Use the same Wi-Fi for phone + computer.

## License

Proprietary - Client Project
