# QTrack - Technical Implementation Guide

This document provides a comprehensive technical guide covering the complete development lifecycle, from initial setup to production deployment and maintenance.

## Table of Contents

1. [Development Environment Setup](#development-environment-setup)
2. [Database Architecture and Implementation](#database-architecture-and-implementation)
3. [Backend Development Workflow](#backend-development-workflow)
4. [Mobile App Development Workflow](#mobile-app-development-workflow)
5. [Testing with Emulators and Physical Devices](#testing-with-emulators-and-physical-devices)
6. [AWS Cloud Infrastructure Setup](#aws-cloud-infrastructure-setup)
7. [Deployment Strategy](#deployment-strategy)
8. [Monitoring and Maintenance](#monitoring-and-maintenance)
9. [Troubleshooting Common Issues](#troubleshooting-common-issues)

---

## Development Environment Setup

### Prerequisites Installation

**Required Software Stack:**

1. **Node.js and npm**

   - Install Node.js 18.x LTS from nodejs.org
   - Verify installation: `node --version` and `npm --version`
   - npm comes bundled with Node.js

2. **PostgreSQL Database**

   - Download PostgreSQL 14+ from postgresql.org/download
   - During installation, set password for `postgres` superuser
   - Install pgAdmin (GUI tool) for database management
   - Verify installation: `psql --version`

3. **Git Version Control**

   - Install Git from git-scm.com
   - Configure: `git config --global user.name "Your Name"`
   - Configure: `git config --global user.email "your.email@example.com"`

4. **Code Editor**

   - Recommended: Visual Studio Code with extensions:
     - ESLint
     - Prettier
     - PostgreSQL
     - React Native Tools
     - GitLens

5. **Mobile Development Tools**
   - **For Android**: Android Studio with Android SDK
     - Install Android SDK Platform 33+
     - Install Android Virtual Device (AVD) Manager
   - **For iOS** (Mac only): Xcode from App Store
     - Install Xcode Command Line Tools
   - **Expo CLI**: `npm install -g expo-cli`

### Project Initialization

**Directory Structure Creation:**

```
QTrack/
├── backend/           # Node.js backend
│   ├── src/
│   ├── tests/
│   └── package.json
├── mobile/           # React Native app
│   ├── src/
│   ├── assets/
│   └── package.json
├── database/         # SQL scripts
│   ├── schema.sql
│   ├── migrations/
│   └── seeds/
├── docs/            # Documentation
├── scripts/          # Deployment scripts
└── .gitignore
```

**Version Control Setup:**

```bash
# Initialize git repository
git init
git add .
git commit -m "Initial project setup"

# Create .gitignore
# Exclude node_modules, .env, build files, etc.
```

---

## Database Architecture and Implementation

### Database Design Philosophy

**Relational Model Approach:**

- Normalized schema to prevent data redundancy
- Foreign key constraints for referential integrity
- Indexes on frequently queried columns
- Enums for status values to ensure data consistency

### Database Setup Process

**Step 1: Create Database Instance**

```sql
-- Connect to PostgreSQL as superuser
psql -U postgres

-- Create database
CREATE DATABASE qtrack;

-- Create dedicated user (optional, for production)
CREATE USER qtrack_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE qtrack TO qtrack_user;

-- Connect to qtrack database
\c qtrack
```

**Step 2: Execute Schema**

```bash
# From project root
psql -U postgres -d qtrack -f database/schema.sql

# Or using migration script
cd backend
npm run migrate
```

**Step 3: Verify Schema**

```sql
-- List all tables
\dt

-- Check table structure
\d materials
\d users
\d material_status_history

-- Verify indexes
\di
```

### Database Connection Management

**Connection Pooling Strategy:**

The backend uses `pg` (node-postgres) library with connection pooling:

```javascript
// backend/src/config/database.js
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // Maximum pool size
  idleTimeoutMillis: 30000, // Close idle clients after 30s
  connectionTimeoutMillis: 2000, // Return error after 2s if connection unavailable
});
```

**Why Connection Pooling:**

- Reuses database connections instead of creating new ones
- Prevents connection exhaustion
- Improves performance under load
- Handles connection failures gracefully

### Database Query Patterns

**Parameterized Queries (SQL Injection Prevention):**

```javascript
// GOOD: Parameterized query
const result = await pool.query(
  "SELECT * FROM materials WHERE material_id = $1",
  [materialId]
);

// BAD: String concatenation (vulnerable to SQL injection)
const result = await pool.query(
  `SELECT * FROM materials WHERE material_id = '${materialId}'`
);
```

**Transaction Management:**

For operations requiring atomicity (all succeed or all fail):

```javascript
const client = await pool.connect();
try {
  await client.query("BEGIN");

  // Multiple operations
  await client.query("INSERT INTO materials ...");
  await client.query("INSERT INTO material_status_history ...");

  await client.query("COMMIT");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
}
```

### Database Indexing Strategy

**Primary Indexes (Automatic):**

- `materials.material_id` (UUID primary key)
- `users.user_id` (UUID primary key)
- `material_status_history.history_id` (UUID primary key)

**Performance Indexes (Manual):**

```sql
-- Fast QR code lookups
CREATE INDEX idx_materials_qr_code ON materials(qr_code);

-- Status filtering
CREATE INDEX idx_materials_status ON materials(current_status);

-- Expiry date queries
CREATE INDEX idx_materials_exp_date ON materials(exp_date);

-- History queries by material
CREATE INDEX idx_history_material_id ON material_status_history(material_id);

-- Timestamp-based history queries
CREATE INDEX idx_history_timestamp ON material_status_history(timestamp DESC);
```

**Index Usage Guidelines:**

- Index columns used in WHERE clauses
- Index columns used in JOIN conditions
- Index columns used for sorting (ORDER BY)
- Don't over-index (slows down INSERT/UPDATE operations)

### Database Migration Strategy

**Migration Files Structure:**

```
database/
├── migrations/
│   ├── 001_initial_schema.sql
│   ├── 002_add_rack_number.sql
│   └── 003_add_expiry_alerts.sql
└── migrate.js
```

**Migration Execution:**

```javascript
// backend/src/database/migrate.js
// Reads migration files in order
// Executes them sequentially
// Tracks executed migrations in migration_log table
```

**Best Practices:**

- Each migration should be idempotent (can run multiple times safely)
- Use transactions for migrations
- Test migrations on development database first
- Keep migrations small and focused

### Database Backup and Recovery

**Backup Strategy:**

```bash
# Full database backup
pg_dump -U postgres -d qtrack -F c -f backup_$(date +%Y%m%d).dump

# Restore from backup
pg_restore -U postgres -d qtrack backup_20241215.dump
```

**Automated Backups:**

- Schedule daily backups using cron (Linux) or Task Scheduler (Windows)
- Store backups in separate location (AWS S3, external drive)
- Test restore procedures regularly
- Keep multiple backup versions (daily, weekly, monthly)

---

## Backend Development Workflow

### Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   │   ├── database.js  # DB connection
│   │   └── constants.js # App constants
│   ├── middleware/      # Express middleware
│   │   └── auth.js     # Authentication & authorization
│   ├── routes/          # API route handlers
│   │   ├── auth.js
│   │   ├── materials.js
│   │   ├── inventory.js
│   │   └── dispensing.js
│   ├── utils/          # Utility functions
│   │   ├── qrGenerator.js
│   │   └── auditLogger.js
│   └── server.js       # Express app entry point
├── tests/              # Test files
├── .env                # Environment variables (gitignored)
└── package.json
```

### Environment Configuration

**Development Environment (.env):**

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=qtrack
DB_USER=postgres
DB_PASSWORD=your_local_password

# Security
JWT_SECRET=dev_secret_key_change_in_production
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=http://localhost:19006
```

**Production Environment (.env.production):**

```env
# Server
PORT=3000
NODE_ENV=production

# Database (AWS RDS)
DB_HOST=qtrack-db.xxxxx.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=qtrack
DB_USER=qtrack_admin
DB_PASSWORD=${AWS_SECRETS_MANAGER_SECRET}

# Security
JWT_SECRET=${AWS_SECRETS_MANAGER_JWT_SECRET}
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=https://your-production-domain.com
```

### API Development Pattern

**RESTful API Design:**

```
GET    /api/materials/:id          # Retrieve material
POST   /api/materials/create       # Create material
PUT    /api/materials/:id/rack     # Update rack number
DELETE /api/materials/:id          # Delete material (if needed)
```

**Request/Response Flow:**

```
Client Request
    ↓
Express Middleware (CORS, Body Parser, Helmet)
    ↓
Authentication Middleware (JWT verification)
    ↓
Authorization Middleware (Role/Permission check)
    ↓
Route Handler (Business Logic)
    ↓
Database Query (Parameterized)
    ↓
Response Formatter
    ↓
Client Response
```

### Authentication Implementation

**JWT Token Flow:**

1. **Login Request:**

   ```
   POST /api/auth/login
   Body: { username, password }
   ```

2. **Server Validation:**

   - Query user from database
   - Compare password hash using bcrypt
   - Generate JWT token with user info
   - Return token to client

3. **Token Structure:**

   ```json
   {
     "userId": "uuid",
     "username": "operator1",
     "role": "Operator",
     "iat": 1234567890,
     "exp": 1234654290
   }
   ```

4. **Subsequent Requests:**
   ```
   Authorization: Bearer <token>
   ```
   - Server verifies token signature
   - Extracts user info from token
   - Attaches to `req.user` for route handlers

**Password Hashing:**

```javascript
// Hashing (during user creation)
const bcrypt = require("bcryptjs");
const saltRounds = 10;
const hash = await bcrypt.hash("plainPassword", saltRounds);

// Verification (during login)
const isValid = await bcrypt.compare("plainPassword", hash);
```

### Error Handling Strategy

**Error Response Format:**

```javascript
// Success
{
  "message": "Material created successfully",
  "material": { ... }
}

// Error
{
  "error": "Material not found",
  "code": "MATERIAL_NOT_FOUND",
  "statusCode": 404
}
```

**Error Middleware:**

```javascript
app.use((err, req, res, next) => {
  console.error("Error:", err);

  // Don't leak error details in production
  const message =
    process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message;

  res.status(err.status || 500).json({
    error: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});
```

### Logging Strategy

**Log Levels:**

- **Error**: Critical issues requiring immediate attention
- **Warn**: Potential issues that should be monitored
- **Info**: General information about application flow
- **Debug**: Detailed information for debugging

**Logging Implementation:**

```javascript
// Use winston or similar logging library
const winston = require("winston");

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

// In production, also log to CloudWatch (AWS)
```

---

## Mobile App Development Workflow

### Project Structure

```
mobile/
├── src/
│   ├── screens/        # Screen components
│   │   ├── auth/
│   │   ├── DashboardScreen.js
│   │   ├── ScanScreen.js
│   │   └── MaterialDetailScreen.js
│   ├── navigation/      # Navigation configuration
│   │   ├── AppNavigator.js
│   │   └── AuthNavigator.js
│   ├── store/          # Redux state management
│   │   ├── authSlice.js
│   │   ├── materialSlice.js
│   │   └── store.js
│   ├── config/         # Configuration
│   │   ├── api.js      # API client setup
│   │   └── constants.js
│   └── components/     # Reusable components
├── assets/             # Images, fonts
├── App.js             # Root component
└── package.json
```

### State Management Architecture

**Redux Toolkit Pattern:**

```javascript
// Store structure
{
  auth: {
    user: { userId, username, role, ... },
    token: "jwt_token_string",
    isAuthenticated: true,
    loading: false,
    error: null
  },
  materials: {
    currentMaterial: { ... },
    history: [ ... ],
    loading: false,
    error: null,
    canEdit: true
  }
}
```

**Async Actions (Thunks):**

```javascript
// Example: Login action
export const login = createAsyncThunk(
  "auth/login",
  async ({ username, password }, { rejectWithValue }) => {
    try {
      const response = await api.post("/auth/login", { username, password });
      // Store token in AsyncStorage
      await AsyncStorage.setItem("authToken", response.data.token);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error);
    }
  }
);
```

### API Client Configuration

**Axios Instance Setup:**

```javascript
// mobile/src/config/api.js
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: Add auth token
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: Handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired - logout user
      await AsyncStorage.removeItem("authToken");
      // Navigate to login screen
    }
    return Promise.reject(error);
  }
);
```

### Navigation Architecture

**Navigation Structure:**

```
AppNavigator (Tab Navigator)
├── Home Stack
│   ├── Dashboard
│   ├── CreateMaterial
│   ├── MaterialDetail
│   └── Inventory
├── Scan Screen
└── Profile Screen
```

**Navigation Flow:**

```javascript
// Navigate programmatically
navigation.navigate('MaterialDetail', { materialId: '...' });

// Pass parameters
navigation.navigate('CreateMaterial', {
  initialData: { ... }
});

// Go back
navigation.goBack();
```

### QR Code Scanning Implementation

**Camera Permission Handling:**

```javascript
// Request camera permission
const [permission, requestPermission] = useCameraPermissions();

if (!permission) {
  // Permission status unknown
  return <LoadingScreen />;
}

if (!permission.granted) {
  // Permission denied - show request button
  return <PermissionRequestScreen onRequest={requestPermission} />;
}

// Permission granted - show camera
return <CameraView onBarcodeScanned={handleScan} />;
```

**QR Code Processing:**

```javascript
const handleBarCodeScanned = async ({ data }) => {
  // Prevent multiple scans
  if (scanned) return;
  setScanned(true);

  // Decode QR payload
  let materialId = data;
  try {
    const decoded = JSON.parse(data);
    if (decoded.id) materialId = decoded.id;
  } catch (e) {
    // Not JSON, use as-is
  }

  // Fetch material from API
  const result = await dispatch(scanMaterial(materialId));

  if (scanMaterial.fulfilled.match(result)) {
    navigation.navigate("MaterialDetail");
  } else {
    Alert.alert("Error", result.payload);
    setScanned(false); // Allow retry
  }
};
```

### Offline Data Handling

**AsyncStorage Usage:**

```javascript
// Store data locally
await AsyncStorage.setItem("authToken", token);
await AsyncStorage.setItem("user", JSON.stringify(user));

// Retrieve data
const token = await AsyncStorage.getItem("authToken");
const user = JSON.parse(await AsyncStorage.getItem("user"));

// Remove data
await AsyncStorage.removeItem("authToken");
```

**Offline-First Strategy (Future Enhancement):**

- Cache material data locally
- Queue API requests when offline
- Sync when connection restored
- Show offline indicator to user

---

## Testing with Emulators and Physical Devices

### Android Emulator Setup

**Prerequisites:**

- Android Studio installed
- Android SDK Platform 33+ installed
- At least 4GB RAM allocated to emulator

**Creating Android Virtual Device (AVD):**

1. Open Android Studio
2. Tools → Device Manager
3. Create Virtual Device
4. Select device (e.g., Pixel 5)
5. Select system image (API 33, Android 13)
6. Configure AVD (RAM: 4096MB, VM heap: 512MB)
7. Finish

**Starting Emulator:**

```bash
# Via Android Studio: Click Play button
# Via Command Line:
emulator -avd Pixel_5_API_33
```

**Connecting Expo to Android Emulator:**

```bash
cd mobile
npm start
# Press 'a' to open on Android emulator
```

**Troubleshooting Android Emulator:**

- Ensure emulator is running before starting Expo
- Check ADB connection: `adb devices`
- Restart ADB if needed: `adb kill-server && adb start-server`
- Increase emulator RAM if app crashes

### iOS Simulator Setup (Mac Only)

**Prerequisites:**

- Xcode installed from App Store
- Xcode Command Line Tools: `xcode-select --install`

**Starting iOS Simulator:**

```bash
# List available simulators
xcrun simctl list devices

# Open specific simulator
open -a Simulator

# Or via Xcode: Xcode → Open Developer Tool → Simulator
```

**Connecting Expo to iOS Simulator:**

```bash
cd mobile
npm start
# Press 'i' to open on iOS simulator
```

**iOS Simulator Tips:**

- Use Cmd+Shift+H for home button
- Use Cmd+K for keyboard toggle
- Shake gesture: Device → Shake
- Screenshot: Cmd+S

### Physical Device Testing

**Android Physical Device:**

1. **Enable Developer Options:**

   - Settings → About Phone → Tap "Build Number" 7 times
   - Settings → Developer Options → Enable "USB Debugging"

2. **Connect Device:**

   ```bash
   # Connect via USB
   adb devices  # Should show your device

   # Or connect via Wi-Fi (same network)
   adb tcpip 5555
   adb connect <device_ip>:5555
   ```

3. **Run Expo:**
   ```bash
   cd mobile
   npm start
   # Scan QR code with Expo Go app
   ```

**iOS Physical Device:**

1. **Register Device:**

   - Xcode → Preferences → Accounts → Add Apple ID
   - Connect device via USB
   - Xcode → Window → Devices and Simulators
   - Select device → Check "Connect via network"

2. **Run Expo:**
   ```bash
   cd mobile
   npm start
   # Scan QR code with Expo Go app (iOS)
   ```

**Network Configuration for Physical Devices:**

- **Backend API URL:** Must use computer's IP address, not `localhost`
- **Find IP:** `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
- **Update:** `mobile/src/config/api.js` → `http://192.168.1.100:3000/api`
- **Firewall:** Allow port 3000 (backend) and 8081 (Expo) through firewall

### Testing Workflow

**Development Testing Cycle:**

1. **Make Code Changes**

   - Edit files in `mobile/src/` or `backend/src/`
   - Save files

2. **Hot Reload (Mobile):**

   - Expo automatically reloads on save
   - Press `r` in terminal to reload manually
   - Press `m` to toggle menu

3. **Backend Changes:**

   - If using `nodemon`, server auto-restarts
   - Otherwise: Stop server (Ctrl+C) and restart

4. **Test Features:**
   - Login/logout flow
   - QR code scanning
   - Material creation
   - Stage transitions
   - Permission checks

**Debugging Tools:**

- **React Native Debugger:** Standalone app for debugging
- **Flipper:** Facebook's debugging platform
- **Console Logs:** `console.log()` statements
- **Redux DevTools:** For state inspection
- **Network Inspector:** Check API requests/responses

---

## AWS Cloud Infrastructure Setup

### AWS Account Setup

**Initial Configuration:**

1. Create AWS account at aws.amazon.com
2. Set up billing alerts (avoid unexpected charges)
3. Create IAM user (don't use root account)
4. Configure AWS CLI: `aws configure`

**IAM User Permissions:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "rds:*",
        "lambda:*",
        "apigateway:*",
        "s3:*",
        "cloudwatch:*",
        "secretsmanager:*"
      ],
      "Resource": "*"
    }
  ]
}
```

### Amazon RDS (PostgreSQL) Setup

**Database Instance Creation:**

1. **Navigate to RDS Console:**

   - AWS Console → RDS → Create Database

2. **Configuration:**

   - Engine: PostgreSQL 14.x
   - Template: Production (or Dev/Test for development)
   - DB Instance Identifier: `qtrack-production`
   - Master Username: `qtrack_admin`
   - Master Password: Strong password (store in Secrets Manager)

3. **Instance Configuration:**

   - DB Instance Class: `db.t3.micro` (free tier) or `db.t3.small` (production)
   - Storage: 20 GB (General Purpose SSD)
   - Storage Autoscaling: Enabled

4. **Connectivity:**

   - VPC: Default VPC or create new
   - Public Access: Yes (for initial setup, restrict later)
   - Security Group: Create new or use existing
   - Port: 5432

5. **Database Options:**
   - Database Name: `qtrack`
   - Backup Retention: 7 days (production)
   - Enable Encryption: Yes

**Security Group Configuration:**

```json
{
  "Inbound Rules": [
    {
      "Type": "PostgreSQL",
      "Protocol": "TCP",
      "Port": 5432,
      "Source": "0.0.0.0/0" // Restrict to your IP in production
    }
  ]
}
```

**Connection String:**

```
postgresql://qtrack_admin:password@qtrack-production.xxxxx.us-east-1.rds.amazonaws.com:5432/qtrack
```

**Update Backend Configuration:**

```env
# backend/.env.production
DB_HOST=qtrack-production.xxxxx.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=qtrack
DB_USER=qtrack_admin
DB_PASSWORD=${AWS_SECRETS_MANAGER_SECRET}
```

### AWS Lambda Function Setup

**Lambda Function for API:**

1. **Create Function:**

   - AWS Console → Lambda → Create Function
   - Runtime: Node.js 18.x
   - Architecture: x86_64

2. **Function Code:**

   ```javascript
   // Upload backend code as deployment package
   // Or use Lambda Layers for dependencies
   ```

3. **Environment Variables:**

   - `DB_HOST`: RDS endpoint
   - `DB_NAME`: qtrack
   - `JWT_SECRET`: From Secrets Manager
   - `NODE_ENV`: production

4. **Configuration:**
   - Memory: 512 MB (adjust based on usage)
   - Timeout: 30 seconds
   - VPC: Attach to same VPC as RDS

**Lambda Deployment:**

```bash
# Package backend code
cd backend
zip -r function.zip . -x "node_modules/*" "*.git*"

# Upload via AWS CLI
aws lambda update-function-code \
  --function-name qtrack-api \
  --zip-file fileb://function.zip
```

### API Gateway Configuration

**REST API Setup:**

1. **Create API:**

   - AWS Console → API Gateway → Create API
   - Type: REST API
   - Name: `qtrack-api`

2. **Create Resources:**

   - `/auth` → POST `/login`
   - `/materials` → GET, POST
   - `/materials/{id}` → GET, PUT
   - `/inventory` → GET, POST

3. **Integration:**

   - Integration Type: Lambda Function
   - Lambda Function: `qtrack-api`
   - Use Lambda Proxy Integration: Yes

4. **Deploy API:**
   - Actions → Deploy API
   - Stage: `production`
   - API URL: `https://xxxxx.execute-api.us-east-1.amazonaws.com/production`

**CORS Configuration:**

```json
{
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS"
}
```

### AWS Secrets Manager

**Storing Sensitive Data:**

1. **Create Secret:**

   - AWS Console → Secrets Manager → Store a new secret
   - Secret Type: Other type of secret
   - Key-value pairs:
     ```
     DB_PASSWORD: your_database_password
     JWT_SECRET: your_jwt_secret_key
     ```

2. **Retrieve in Lambda:**

   ```javascript
   const AWS = require("aws-sdk");
   const secretsManager = new AWS.SecretsManager();

   const secret = await secretsManager
     .getSecretValue({
       SecretId: "qtrack/secrets",
     })
     .promise();

   const secrets = JSON.parse(secret.SecretString);
   ```

### Amazon S3 for File Storage

**Bucket Creation:**

1. **Create Bucket:**

   - AWS Console → S3 → Create Bucket
   - Bucket Name: `qtrack-storage-production`
   - Region: Same as other resources
   - Block Public Access: Enabled (use presigned URLs)

2. **Bucket Policies:**
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Principal": {
           "AWS": "arn:aws:iam::account-id:role/lambda-role"
         },
         "Action": ["s3:PutObject", "s3:GetObject"],
         "Resource": "arn:aws:s3:::qtrack-storage-production/*"
       }
     ]
   }
   ```

**Use Cases:**

- Store QR code images
- Material photos/documents
- Export reports
- Backup files

### CloudWatch Monitoring

**Log Groups:**

- Lambda Function Logs: `/aws/lambda/qtrack-api`
- Application Logs: `/qtrack/application`

**Metrics to Monitor:**

- API request count
- API latency
- Error rate
- Database connection count
- Lambda function duration
- Lambda function errors

**Alarms:**

- High error rate (> 5% errors)
- High latency (> 2 seconds)
- Database connection failures
- Lambda function timeouts

---

## Deployment Strategy

### Backend Deployment

**Option 1: AWS Lambda + API Gateway (Serverless)**

**Advantages:**

- Auto-scaling
- Pay per request
- No server management
- Built-in high availability

**Deployment Steps:**

1. Package backend code:

   ```bash
   cd backend
   npm install --production
   zip -r function.zip . -x "*.git*" "tests/*"
   ```

2. Upload to Lambda:

   ```bash
   aws lambda update-function-code \
     --function-name qtrack-api \
     --zip-file fileb://function.zip
   ```

3. Update environment variables
4. Deploy API Gateway changes

**Option 2: AWS EC2 (Traditional Server)**

**Advantages:**

- Full control
- Can run any software
- Predictable costs

**Deployment Steps:**

1. Launch EC2 instance:

   - AMI: Amazon Linux 2
   - Instance Type: t3.small or larger
   - Security Group: Allow HTTP (80), HTTPS (443), SSH (22)

2. Install Node.js:

   ```bash
   sudo yum update -y
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install 18
   ```

3. Deploy application:

   ```bash
   git clone <repository>
   cd QTrack/backend
   npm install --production
   ```

4. Use PM2 for process management:

   ```bash
   npm install -g pm2
   pm2 start src/server.js --name qtrack-api
   pm2 save
   pm2 startup  # Auto-start on reboot
   ```

5. Setup Nginx reverse proxy:

   ```nginx
   server {
     listen 80;
     server_name api.yourdomain.com;

     location / {
       proxy_pass http://localhost:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }
   }
   ```

6. Setup SSL with Let's Encrypt:
   ```bash
   sudo yum install certbot python3-certbot-nginx
   sudo certbot --nginx -d api.yourdomain.com
   ```

### Mobile App Deployment

**Development Build:**

```bash
cd mobile
npm start
# Test with Expo Go
```

**Production Build:**

**Android (APK/AAB):**

```bash
cd mobile

# Build APK (for direct distribution)
expo build:android -t apk

# Build AAB (for Google Play Store)
expo build:android -t app-bundle
```

**iOS (IPA):**

```bash
cd mobile

# Build for App Store
expo build:ios --type archive
```

**EAS Build (Recommended):**

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure
eas build:configure

# Build
eas build --platform android
eas build --platform ios
```

**App Store Submission:**

1. **Google Play Store:**

   - Create developer account ($25 one-time)
   - Upload AAB file
   - Fill store listing
   - Submit for review

2. **Apple App Store:**
   - Create developer account ($99/year)
   - Upload IPA via Xcode or Transporter
   - Fill App Store Connect information
   - Submit for review

### Database Migration in Production

**Migration Process:**

1. **Backup Production Database:**

   ```bash
   pg_dump -h <rds-endpoint> -U qtrack_admin -d qtrack -F c -f backup_$(date +%Y%m%d).dump
   ```

2. **Test Migration on Staging:**

   ```bash
   # Apply migration to staging database first
   psql -h <staging-rds> -U qtrack_admin -d qtrack -f migrations/004_new_feature.sql
   ```

3. **Apply to Production:**

   ```bash
   # During maintenance window
   psql -h <production-rds> -U qtrack_admin -d qtrack -f migrations/004_new_feature.sql
   ```

4. **Verify:**
   ```sql
   -- Check migration was applied
   SELECT * FROM migration_log ORDER BY applied_at DESC;
   ```

**Rollback Strategy:**

- Keep backup before migration
- Test rollback script on staging
- Document rollback procedure
- Have rollback script ready

---

## Monitoring and Maintenance

### Application Monitoring

**Key Metrics to Track:**

1. **Performance Metrics:**

   - API response time (p50, p95, p99)
   - Database query execution time
   - Mobile app load time
   - QR scan success rate

2. **Error Metrics:**

   - Error rate by endpoint
   - Error types and frequencies
   - Failed authentication attempts
   - Database connection errors

3. **Usage Metrics:**
   - Daily active users
   - Materials created per day
   - QR scans per day
   - Stage transitions per day

**Monitoring Tools:**

- **CloudWatch** (AWS): Built-in monitoring
- **Sentry**: Error tracking and performance monitoring
- **New Relic**: Application performance monitoring
- **Datadog**: Infrastructure and application monitoring

### Logging Strategy

**Log Levels:**

```javascript
// Error: Critical issues
logger.error("Database connection failed", { error, context });

// Warn: Potential issues
logger.warn("High number of failed login attempts", { username, count });

// Info: Important events
logger.info("Material created", { materialId, userId });

// Debug: Detailed information
logger.debug("QR code generated", { materialId, qrCode });
```

**Log Aggregation:**

- Centralize logs in CloudWatch Logs
- Use log groups for different components
- Set up log retention policies
- Create log-based metrics and alarms

### Database Maintenance

**Regular Tasks:**

1. **Vacuum and Analyze:**

   ```sql
   -- Reclaim storage and update statistics
   VACUUM ANALYZE;

   -- For specific table
   VACUUM ANALYZE materials;
   ```

2. **Index Maintenance:**

   ```sql
   -- Rebuild indexes if fragmented
   REINDEX TABLE materials;

   -- Check index usage
   SELECT schemaname, tablename, indexname, idx_scan
   FROM pg_stat_user_indexes
   ORDER BY idx_scan;
   ```

3. **Statistics Update:**
   ```sql
   -- Update query planner statistics
   ANALYZE;
   ```

**Performance Monitoring:**

```sql
-- Check slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Backup and Disaster Recovery

**Backup Schedule:**

- **Full Backup:** Daily at 2 AM
- **Incremental Backup:** Every 6 hours
- **Transaction Log Backup:** Every 15 minutes (if using WAL archiving)

**Backup Storage:**

- Store backups in S3 with versioning enabled
- Keep daily backups for 30 days
- Keep weekly backups for 12 weeks
- Keep monthly backups for 12 months

**Disaster Recovery Plan:**

1. **RTO (Recovery Time Objective):** 4 hours
2. **RPO (Recovery Point Objective):** 1 hour

**Recovery Procedure:**

```bash
# 1. Identify latest backup
aws s3 ls s3://qtrack-backups/

# 2. Restore database
pg_restore -h <rds-endpoint> -U qtrack_admin -d qtrack backup.dump

# 3. Verify data integrity
psql -h <rds-endpoint> -U qtrack_admin -d qtrack -c "SELECT COUNT(*) FROM materials;"

# 4. Test application functionality
```

### Security Maintenance

**Regular Security Tasks:**

1. **Dependency Updates:**

   ```bash
   # Check for vulnerabilities
   npm audit

   # Update dependencies
   npm update

   # Update major versions (test first)
   npm install package@latest
   ```

2. **Security Patches:**

   - Monitor security advisories
   - Apply OS patches (EC2 instances)
   - Update RDS engine versions
   - Rotate secrets regularly

3. **Access Review:**

   - Review IAM user permissions quarterly
   - Remove unused access keys
   - Rotate database passwords annually
   - Review API access logs

4. **Penetration Testing:**
   - Conduct security audits annually
   - Test for SQL injection vulnerabilities
   - Test authentication and authorization
   - Review error messages for information leakage

### Performance Optimization

**Database Optimization:**

- Monitor slow queries and optimize
- Add indexes for frequently queried columns
- Partition large tables if needed
- Use connection pooling effectively

**API Optimization:**

- Implement response caching where appropriate
- Use pagination for large result sets
- Compress responses (gzip)
- Minimize database round trips

**Mobile App Optimization:**

- Optimize bundle size
- Implement lazy loading
- Cache API responses
- Optimize images and assets

---

## Troubleshooting Common Issues

### Database Connection Issues

**Problem:** Cannot connect to database

**Diagnosis:**

```bash
# Test connection
psql -h <host> -U <user> -d <database>

# Check if PostgreSQL is running
# Windows: services.msc → PostgreSQL service
# Linux: sudo systemctl status postgresql
```

**Solutions:**

- Verify database credentials in `.env`
- Check firewall rules (port 5432)
- Verify database exists: `psql -l`
- Check RDS security group (if using AWS)
- Verify network connectivity

### API Connection Issues

**Problem:** Mobile app cannot connect to backend

**Diagnosis:**

```bash
# Test backend health
curl http://localhost:3000/health

# Check if backend is running
netstat -an | findstr :3000  # Windows
lsof -i :3000                 # Mac/Linux
```

**Solutions:**

- Verify backend server is running
- Check API URL in mobile config (use IP, not localhost for physical devices)
- Verify CORS configuration
- Check firewall settings
- Ensure phone and computer on same Wi-Fi network

### QR Code Scanning Issues

**Problem:** QR code not scanning

**Diagnosis:**

- Check camera permissions
- Verify QR code format matches expected structure
- Test QR code with other scanner apps

**Solutions:**

- Grant camera permissions in app settings
- Ensure QR code contains valid Material ID
- Check QR code generation logic
- Verify QR payload format: `{"id":"MAT-...","v":1}`

### Authentication Issues

**Problem:** Login fails or token expires

**Diagnosis:**

```javascript
// Check token expiration
const decoded = jwt.decode(token);
console.log("Expires:", new Date(decoded.exp * 1000));
```

**Solutions:**

- Verify JWT_SECRET matches between token creation and verification
- Check token expiration time
- Ensure token is included in Authorization header
- Verify user exists and is active in database

### Performance Issues

**Problem:** Slow API responses

**Diagnosis:**

```sql
-- Check slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC;
```

**Solutions:**

- Add database indexes
- Optimize slow queries
- Increase database instance size (RDS)
- Implement caching
- Use connection pooling

---

## Best Practices Summary

### Code Organization

- Keep functions small and focused
- Use meaningful variable and function names
- Add comments for complex logic
- Follow consistent code style (use Prettier/ESLint)
- Separate concerns (routes, business logic, data access)

### Security

- Never commit secrets to git
- Use environment variables for configuration
- Validate all user inputs
- Use parameterized queries (prevent SQL injection)
- Implement rate limiting
- Use HTTPS in production
- Regular security audits

### Testing

- Write unit tests for critical functions
- Test API endpoints with different scenarios
- Test permission checks
- Test error handling
- Test on multiple devices and OS versions

### Documentation

- Keep README updated
- Document API endpoints
- Comment complex algorithms
- Maintain changelog
- Document deployment procedures

### Version Control

- Use meaningful commit messages
- Create branches for features
- Review code before merging
- Tag releases
- Keep `.gitignore` updated

---

This technical guide provides a comprehensive overview of implementing, deploying, and maintaining the QTrack system. For specific implementation details, refer to the code comments and API documentation.

