# 🚀 QTrack - Quick Start Guide for Beginners

## Step-by-Step Setup

### Step 1: Set Up Backend (Database & Server)

#### 1.1 Install PostgreSQL (if not installed)

- Download from: https://www.postgresql.org/download/
- Install and remember your password

#### 1.2 Create Database

1. Open **pgAdmin** (comes with PostgreSQL) or use command line
2. Create a new database called `qtrack`

**OR use command line:**

```bash
# Open PowerShell/Command Prompt
psql -U postgres
# Enter your PostgreSQL password when prompted
CREATE DATABASE qtrack;
\q
```

#### 1.3 Configure Backend

1. Navigate to backend folder:

```bash
cd backend
```

2. Create `.env` file in the `backend` folder with this content:

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=qtrack
DB_USER=postgres
DB_PASSWORD=your_postgres_password_here

JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=24h

CORS_ORIGIN=http://localhost:19006
```

**Replace `your_postgres_password_here` with your actual PostgreSQL password!**

#### 1.4 Install Backend Dependencies & Start Server

```bash
cd backend
npm install
npm run migrate
npm run dev
```

**✅ You should see:** `🚀 QTrack Backend Server running on port 3000`

**Keep this terminal window open!** The backend must stay running.

---

### Step 2: Set Up Mobile App

#### 2.1 Find Your Computer's IP Address

**On Windows:**

1. Open Command Prompt or PowerShell
2. Type: `ipconfig`
3. Look for **IPv4 Address** under your active network adapter
   - Example: `192.168.1.100` or `192.168.0.105`

**On Mac/Linux:**

1. Open Terminal
2. Type: `ifconfig` or `ip addr`
3. Look for your local IP address

**Write down this IP address!** You'll need it next.

#### 2.2 Configure Mobile App API URL

1. Open file: `mobile/src/config/api.js`

2. Find this line:

```javascript
const API_BASE_URL = __DEV__
  ? "http://localhost:3000/api"
  : "https://your-production-api.com/api";
```

3. Replace `localhost` with your IP address:

```javascript
const API_BASE_URL = __DEV__
  ? "http://192.168.1.100:3000/api" // Use YOUR IP address here!
  : "https://your-production-api.com/api";
```

**Example:** If your IP is `192.168.0.105`, it should be:

```javascript
const API_BASE_URL = __DEV__
  ? "http://192.168.0.105:3000/api"
  : "https://your-production-api.com/api";
```

#### 2.3 Install Mobile Dependencies & Start Expo

```bash
# Open a NEW terminal window (keep backend running!)
cd mobile
npm install
npm start
```

**✅ You should see:**

- A QR code in the terminal
- Options: `Press a │ open Android`, `Press i │ open iOS simulator`, etc.

---

### Step 3: Connect Expo Go on Your Phone

#### 3.1 Make Sure Phone & Computer Are on Same Wi-Fi

- **Important:** Both must be on the same Wi-Fi network!

#### 3.2 Open Expo Go App

- Open the **Expo Go** app you downloaded

#### 3.3 Scan QR Code

- In Expo Go, tap **"Scan QR code"**
- Point your phone camera at the QR code shown in the terminal
- Wait for the app to load (first time takes 30-60 seconds)

**OR** if scanning doesn't work:

- In Expo Go, tap **"Enter URL manually"**
- Type: `exp://YOUR_IP:8081`
  - Replace `YOUR_IP` with your computer's IP address
  - Example: `exp://192.168.1.100:8081`

---

## 🎯 What You Should See

1. **Expo Go app loads** → Shows "QTrack" app
2. **Login screen appears** → You can login
3. **Backend terminal** → Shows API requests coming in

---

## 🔧 Troubleshooting

### Problem: "Unable to connect to server"

**Solution:**

- Check backend is running (`npm run dev` in backend folder)
- Check API URL in `mobile/src/config/api.js` uses your IP, not localhost
- Make sure phone and computer are on same Wi-Fi
- Try disabling Windows Firewall temporarily

### Problem: "Network request failed"

**Solution:**

- Check your IP address is correct
- Make sure backend server is running
- Check firewall isn't blocking port 3000

### Problem: QR code won't scan

**Solution:**

- Make sure terminal window is large enough to show full QR code
- Try manual URL entry in Expo Go
- Make sure phone camera has permission

### Problem: "Database connection error"

**Solution:**

- Check PostgreSQL is running
- Check `.env` file has correct database password
- Make sure database `qtrack` exists

---

## ✅ Success Checklist

- [ ] PostgreSQL installed and running
- [ ] Database `qtrack` created
- [ ] Backend `.env` file configured
- [ ] Backend server running (`npm run dev`)
- [ ] Mobile API URL updated with your IP address
- [ ] Mobile dependencies installed (`npm install`)
- [ ] Expo server running (`npm start`)
- [ ] Phone and computer on same Wi-Fi
- [ ] Expo Go app installed on phone
- [ ] QR code scanned or URL entered manually

---

## 🎉 Once Connected

You should see the **QTrack login screen** in Expo Go!

**Test Login:**

- Username: `operator1`
- Password: `password123`

(Note: You'll need to create these users in the database first, or we can add a user creation script)

---

## Need Help?

If you get stuck at any step, let me know:

1. Which step you're on
2. What error message you see
3. Screenshot if possible

I'll help you troubleshoot! 🚀
