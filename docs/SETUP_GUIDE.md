# QTrack Setup Guide

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ installed and running
- Expo CLI installed (`npm install -g expo-cli`)
- Android Studio / Xcode (for mobile development)

## Backend Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Create a `.env` file in the `backend` directory:

```bash
cp .env.example .env
```

Edit `.env` with your database credentials:

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=qtrack
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=24h

CORS_ORIGIN=http://localhost:19006
```

### 3. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE qtrack;

# Exit psql
\q
```

### 4. Run Migrations

```bash
npm run migrate
```

This will:

- Create all database tables
- Insert default roles (Operator, Viewer)
- Insert seed data (test users)

### 5. Create Test Users

The seed file creates placeholder users. To create real users, you'll need to hash passwords:

```javascript
const bcrypt = require("bcryptjs");
const hash = await bcrypt.hash("password123", 10);
// Use this hash in the database
```

Or use the backend API to create users (you'll need to add a user creation endpoint).

### 6. Start Backend Server

```bash
npm run dev
```

The server will start on `http://localhost:3000`

---

## Mobile App Setup

### 1. Install Dependencies

```bash
cd mobile
npm install
```

### 2. Configure API URL

Edit `mobile/src/config/api.js` and update the `API_BASE_URL`:

```javascript
const API_BASE_URL = __DEV__
  ? "http://YOUR_LOCAL_IP:3000/api" // Use your computer's local IP for physical device testing
  : "https://your-production-api.com/api";
```

**Important:** For physical device testing:

- Use your computer's local IP address (not `localhost`)
- Ensure mobile device and computer are on the same network
- Example: `http://192.168.1.100:3000/api`

### 3. Start Expo Development Server

```bash
npm start
```

Then:

- Press `a` for Android emulator
- Press `i` for iOS simulator
- Scan QR code with Expo Go app on physical device

---

## Testing

### Test Credentials

After running migrations, you can test with:

**Operator:**

- Username: `operator1`
- Password: `password123` (change this hash in database)

**Viewer:**

- Username: `viewer1`
- Password: `password123` (change this hash in database)

### Test Flow

1. Login as Operator
2. Create a new material
3. Scan the generated QR code
4. Move material through stages:
   - Quarantine → Under Test
   - Under Test → Approved
   - Update Rack Number
   - Dispense to Manufacturing
5. Login as Viewer and verify read-only access

---

## Troubleshooting

### Database Connection Issues

- Ensure PostgreSQL is running
- Check database credentials in `.env`
- Verify database exists: `psql -U postgres -l`

### Mobile App Can't Connect to Backend

- Check API URL in `mobile/src/config/api.js`
- Ensure backend is running
- For physical devices, use local IP, not `localhost`
- Check firewall settings

### QR Code Scanning Issues

- Ensure camera permissions are granted
- Test QR code generation first
- Verify QR payload format matches expected structure

### Permission Errors

- Verify user role in database
- Check role-permission mapping in `backend/src/config/constants.js`
- Ensure JWT token is being sent in requests

---

## Production Deployment

### Backend

1. Set `NODE_ENV=production` in `.env`
2. Use strong `JWT_SECRET`
3. Configure proper CORS origins
4. Set up SSL/TLS
5. Use environment-specific database credentials
6. Set up proper logging and monitoring

### Mobile App

1. Update API URL to production endpoint
2. Build production app:
   ```bash
   expo build:android
   expo build:ios
   ```
3. Configure app signing
4. Submit to app stores

---

## Next Steps

- [ ] Implement user management (create/edit users)
- [ ] Add QR label printing functionality
- [ ] Implement offline mode with sync
- [ ] Add push notifications for expiry alerts
- [ ] Set up CI/CD pipeline
- [ ] Add comprehensive error handling
- [ ] Implement data export/reporting
