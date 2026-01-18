# QTrack - Step-by-Step Setup Guide

Follow these steps **ONE BY ONE**. Complete each step before moving to the next.

---

## STEP 1: Check PostgreSQL Installation

**What to do:**
- Check if PostgreSQL is installed on your computer

**How to check:**
1. Press `Windows + R`
2. Type: `services.msc` and press Enter
3. Look for service named "postgresql" or "PostgreSQL"

**If PostgreSQL is NOT installed:**
- Download from: https://www.postgresql.org/download/windows/
- Install it (remember the password you set!)
- Come back to this step

**If PostgreSQL IS installed:**
- ✅ Move to STEP 2

**Status:** [ ] Not Started | [ ] In Progress | [ ] Completed

---

## STEP 2: Start PostgreSQL Service

**What to do:**
- Make sure PostgreSQL is running

**How to do it:**
1. Open `services.msc` (Windows + R → services.msc)
2. Find "postgresql" service
3. Right-click → Start (if not running)
4. Verify status shows "Running"

**Status:** [ ] Not Started | [ ] In Progress | [ ] Completed

---

## STEP 3: Create Database

**What to do:**
- Create the `qtrack` database in PostgreSQL

**How to do it:**

**Option A: Using pgAdmin (GUI - Easier)**
1. Open pgAdmin (search in Start menu)
2. Connect to PostgreSQL server (enter password if asked)
3. Right-click "Databases" → Create → Database
4. Name: `qtrack`
5. Click Save

**Option B: Using Command Line**
1. Open PowerShell
2. Run: `psql -U postgres`
3. Enter your PostgreSQL password when prompted
4. Run: `CREATE DATABASE qtrack;`
5. Run: `\q` to exit

**Verify:**
- Database `qtrack` should exist

**Status:** [ ] Not Started | [ ] In Progress | [ ] Completed

---

## STEP 4: Update Backend .env File

**What to do:**
- Update database password in backend/.env file

**How to do it:**
1. Open file: `backend/.env`
2. Find line: `DB_PASSWORD=your_password_here`
3. Replace `your_password_here` with your actual PostgreSQL password
4. Save the file

**Example:**
```env
DB_PASSWORD=postgres123  # Your actual password
```

**Status:** [ ] Not Started | [ ] In Progress | [ ] Completed

---

## STEP 5: Run Database Migrations

**What to do:**
- Create all database tables

**How to do it:**
1. Open PowerShell
2. Navigate to backend folder: `cd D:\Desktop\QTrack\backend`
3. Run: `npm run migrate`
4. Wait for completion
5. Should see: "✅ Database schema created successfully"

**If you see errors:**
- Check PostgreSQL is running (STEP 2)
- Check password in .env is correct (STEP 4)
- Share the error message

**Status:** [ ] Not Started | [ ] In Progress | [ ] Completed

---

## STEP 6: Create Test User (Optional but Recommended)

**What to do:**
- Create a test user so you can login

**How to do it:**
1. We'll create a user with password "test123"
2. I'll provide the command to run

**Status:** [ ] Not Started | [ ] In Progress | [ ] Completed

---

## STEP 7: Start Backend Server

**What to do:**
- Start the backend API server

**How to do it:**
1. Open PowerShell (keep it open!)
2. Navigate: `cd D:\Desktop\QTrack\backend`
3. Run: `npm run dev`
4. Wait for message: "🚀 QTrack Backend Server running on port 3000"
5. **Keep this terminal window open!**

**Test it:**
- Open browser: http://localhost:3000/health
- Should see: `{"status":"ok","timestamp":"..."}`

**Status:** [ ] Not Started | [ ] In Progress | [ ] Completed

---

## STEP 8: Verify Your Computer's IP Address

**What to do:**
- Find your computer's IP address for mobile app connection

**How to do it:**
1. Open PowerShell
2. Run: `ipconfig`
3. Look for "IPv4 Address" under your active network adapter
4. Write it down (example: `192.168.1.100`)

**Status:** [ ] Not Started | [ ] In Progress | [ ] Completed
**Your IP:** ________________

---

## STEP 9: Update Mobile App API URL

**What to do:**
- Update mobile app to connect to your backend

**How to do it:**
1. Open file: `mobile/src/config/api.js`
2. Find line with your IP address (should be `192.168.137.1`)
3. If your IP from STEP 8 is different, update it
4. Save the file

**Example:**
```javascript
const API_BASE_URL = __DEV__
  ? "http://192.168.137.1:3000/api"  // Your IP from STEP 8
  : "https://your-production-api.com/api";
```

**Status:** [ ] Not Started | [ ] In Progress | [ ] Completed

---

## STEP 10: Start Mobile App (Expo)

**What to do:**
- Start the Expo development server

**How to do it:**
1. Open a NEW PowerShell window (keep backend running!)
2. Navigate: `cd D:\Desktop\QTrack\mobile`
3. Run: `npm start`
4. Wait for QR code to appear
5. **Keep this terminal window open!**

**What you'll see:**
- QR code in terminal
- Options: Press `a` for Android, `i` for iOS, etc.

**Status:** [ ] Not Started | [ ] In Progress | [ ] Completed

---

## STEP 11: Connect with Expo Go

**What to do:**
- Open the app on your phone

**How to do it:**
1. Make sure phone and computer are on **same Wi-Fi network**
2. Open **Expo Go** app on your phone
3. Tap "Scan QR code"
4. Point camera at QR code in terminal (from STEP 10)
5. Wait for app to load (30-60 seconds first time)

**If scanning doesn't work:**
- In Expo Go, tap "Enter URL manually"
- Type: `exp://192.168.137.1:8081` (use your IP from STEP 8)

**Status:** [ ] Not Started | [ ] In Progress | [ ] Completed

---

## STEP 12: Test Login

**What to do:**
- Login to the app

**How to do it:**
1. App should show login screen
2. Enter test credentials (we'll create in STEP 6)
3. Tap Login
4. Should see dashboard

**Status:** [ ] Not Started | [ ] In Progress | [ ] Completed

---

## Current Status Summary

- [ ] STEP 1: PostgreSQL Installed
- [ ] STEP 2: PostgreSQL Running
- [ ] STEP 3: Database Created
- [ ] STEP 4: .env Updated
- [ ] STEP 5: Migrations Run
- [ ] STEP 6: Test User Created
- [ ] STEP 7: Backend Running
- [ ] STEP 8: IP Address Found
- [ ] STEP 9: Mobile API URL Updated
- [ ] STEP 10: Expo Started
- [ ] STEP 11: Connected with Expo Go
- [ ] STEP 12: Login Successful

---

## Ready to Start?

**Tell me when you're ready and I'll guide you through STEP 1!**

Or if you've already completed some steps, tell me which step you're on and we'll continue from there.
