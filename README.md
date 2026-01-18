# QTrack - QR-Based Warehouse & Material Management System

A professional, reliable QR-code-driven Warehouse Management System (WMS) for end-to-end material tracking, quality control workflows, and inventory management.

## Project Structure

```
QTrack/
├── mobile/              # React Native mobile application
├── backend/             # Node.js/Express backend API
├── database/            # Database schema and migrations
└── docs/                # Documentation
```

## Core Features

- **Material Receipt & Quarantine**: Generate QR codes on material receipt
- **Quality Control Workflow**: Track sampling, testing, and approval/rejection
- **Stage-wise Tracking**: Quarantine → Under Test → Approved/Rejected → Dispensed
- **Permission-based Access**: Operator (full access) and Viewer (read-only)
- **Complete Audit Trail**: Track all actions with user, timestamp, and comments
- **Inventory Management**: Inward, outward, and expiry alerts
- **FIFO/FEFO Dispensing**: First In First Out / First Expiry First Out logic
- **QR Label Printing**: Direct Bluetooth thermal printer integration

## User Roles

1. **Operator**: Full permissions (create, edit, move stages, approve/reject, dispense)
2. **Viewer**: Read-only access (scan QR, view details, view history)

## Technology Stack

### Mobile App

- React Native (Expo)
- React Navigation
- QR Scanner (expo-camera)
- Thermal Printer Integration
- Redux Toolkit (State Management)

### Backend

- Node.js + Express
- PostgreSQL (Amazon RDS)
- JWT Authentication
- AWS Services (Lambda, API Gateway, S3)

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- React Native development environment
- Expo CLI

### Installation

```bash
# Install dependencies
cd mobile && npm install
cd ../backend && npm install

# Set up database
cd database && npm run migrate

# Start backend
cd backend && npm run dev

# Start mobile app
cd mobile && npm start
```

## Material Lifecycle

```
Quarantine → Under Test → Approved/Rejected → Dispensed
```

Each stage transition is logged with complete audit trail.

## QR Code Structure

QR code contains unique Material ID. Full material details fetched from backend on scan.

## Implementation Guide

This section provides a comprehensive guide on how to implement the features outlined in `PROJECT_SUMMARY.md`. Follow these steps to set up and deploy the QTrack system.

### System Architecture Overview

The QTrack system follows a three-tier architecture:

1. **Presentation Layer**: React Native mobile application (iOS and Android)
2. **Application Layer**: Node.js/Express REST API backend
3. **Data Layer**: PostgreSQL database for persistent storage

### Implementation Phases

#### Phase 1: Database Setup and Configuration

**Objective**: Establish the foundation database structure and initial configuration.

**Steps**:

1. **Database Installation**

   - Install PostgreSQL 14+ on the server
   - Create a dedicated database instance: `qtrack`
   - Configure database user with appropriate permissions

2. **Schema Deployment**

   - Execute `database/schema.sql` to create all required tables
   - Verify table creation: `materials`, `users`, `roles`, `material_status_history`, `inventory_transactions`, `expiry_alerts`
   - Run `database/seed.sql` to populate initial roles (Operator, Viewer)

3. **Database Configuration**
   - Update `backend/.env` with database connection parameters
   - Set `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
   - Test database connectivity using migration script

**Verification**:

```bash
cd backend
npm run migrate
# Should complete without errors
```

#### Phase 2: Backend API Implementation

**Objective**: Deploy and configure the REST API backend service.

**Steps**:

1. **Environment Configuration**

   - Copy `backend/.env.example` to `backend/.env`
   - Configure environment variables:
     - `PORT`: API server port (default: 3000)
     - `JWT_SECRET`: Strong secret key for token generation
     - `JWT_EXPIRES_IN`: Token expiration time (default: 24h)
     - `CORS_ORIGIN`: Allowed origin for mobile app

2. **Dependency Installation**

   ```bash
   cd backend
   npm install
   ```

3. **Server Initialization**

   ```bash
   npm run dev  # Development mode with auto-reload
   # OR
   npm start    # Production mode
   ```

4. **API Endpoint Verification**
   - Health check: `GET http://localhost:3000/health`
   - Should return: `{"status":"ok","timestamp":"..."}`

**Key API Modules**:

- Authentication (`/api/auth/*`): User login and session management
- Materials (`/api/materials/*`): Material CRUD and QR operations
- Inventory (`/api/inventory/*`): Stock management and expiry tracking
- Dispensing (`/api/materials/*/dispense`): Manufacturing issue operations

#### Phase 3: Mobile Application Deployment

**Objective**: Build and deploy the React Native mobile application.

**Steps**:

1. **Environment Configuration**

   - Update `mobile/src/config/api.js`
   - Set `API_BASE_URL` to match backend server address
   - For physical devices: Use server's IP address (e.g., `http://192.168.1.100:3000/api`)
   - For emulators: Use `localhost` (e.g., `http://localhost:3000/api`)

2. **Dependency Installation**

   ```bash
   cd mobile
   npm install
   ```

3. **Development Server**

   ```bash
   npm start
   # Opens Expo development server
   # Scan QR code with Expo Go app or press 'a' for Android / 'i' for iOS
   ```

4. **Production Build** (when ready)

   ```bash
   # Android
   expo build:android

   # iOS
   expo build:ios
   ```

**Mobile App Components**:

- Authentication flow: Login screen with role-based redirect
- Dashboard: Role-specific navigation and quick actions
- QR Scanner: Camera-based QR code scanning with permission handling
- Material Management: Create, view, and update materials
- Stage Transitions: Move materials through workflow stages
- Inventory Views: Expiry alerts and stock information

#### Phase 4: User Management and Authentication

**Objective**: Set up user accounts and role-based access control.

**Steps**:

1. **Create Initial Users**

   - Use database seed script or manual SQL insertion
   - Hash passwords using bcrypt (cost factor: 10)
   - Assign appropriate roles (Operator or Viewer)

2. **Role Configuration**

   - Operator role: Full system access
   - Viewer role: Read-only access
   - Roles are defined in `backend/src/config/constants.js`

3. **Authentication Flow**
   - Users login via mobile app
   - Backend validates credentials and returns JWT token
   - Token stored in AsyncStorage for subsequent requests
   - Token included in Authorization header for API calls

**User Creation Example**:

```sql
INSERT INTO users (username, email, password_hash, full_name, role_id)
VALUES (
  'operator1',
  'operator@qtrack.com',
  '$2a$10$hashed_password_here',
  'John Operator',
  1  -- Operator role_id
);
```

#### Phase 5: Material Workflow Implementation

**Objective**: Implement the complete material lifecycle workflow.

**Workflow Stages**:

1. **Material Receipt (Quarantine)**

   - Operator creates material entry via mobile app
   - System generates unique QR code (format: `MAT-YYYYMMDD-HASH`)
   - Material status set to `QUARANTINE`
   - QR code displayed for printing

2. **Quality Control Sampling**

   - Operator scans QR code
   - Moves material to `UNDER_TEST` status
   - System logs sampling action with user and timestamp

3. **QC Decision**

   - Operator approves or rejects material
   - If approved: Status changes to `APPROVED`
   - If rejected: Status changes to `REJECTED` (requires reason)
   - Rejected materials cannot proceed further

4. **Storage Assignment**

   - After approval, Operator can update rack/storage location
   - System logs rack number assignment

5. **Manufacturing Dispensing**
   - Only `APPROVED` materials can be dispensed
   - System applies FIFO (First In First Out) or FEFO (First Expiry First Out) logic
   - Quantity deducted from remaining stock
   - If fully dispensed, status changes to `DISPENSED`

**Implementation Notes**:

- All stage transitions are logged in `material_status_history` table
- Sequential flow enforced (cannot skip stages)
- Permission checks at each transition point
- Real-time quantity tracking maintained

#### Phase 6: QR Code and Printing Integration

**Objective**: Implement QR code generation and label printing.

**QR Code Generation**:

- Backend generates QR code using `qrcode` library
- QR payload contains Material ID: `{"id":"MAT-20241215-A3F9B2C1","v":1}`
- QR image returned as base64 data URL
- Label data includes human-readable material information

**Printing Implementation** (Pending):

- Integrate Bluetooth thermal printer library
- Format label with QR code and material details
- Support standard label sizes (4x6 inches recommended)
- Print directly from mobile device

**Current Status**: QR generation complete, printing integration pending

#### Phase 7: Inventory Management

**Objective**: Implement inventory tracking and expiry management.

**Features**:

- **Inward Transactions**: Record additional stock received
- **Outward Transactions**: Record stock adjustments or transfers
- **Expiry Alerts**: Automatic detection of materials approaching expiry
- **Real-time Stock**: Current quantity always visible and updated

**Implementation**:

- Inventory transactions logged in `inventory_transactions` table
- Material `remaining_quantity` updated automatically
- Expiry alerts query materials expiring within specified days (default: 30)
- Alerts displayed in mobile app Inventory screen

#### Phase 8: Audit Trail and Compliance

**Objective**: Ensure complete traceability of all material actions.

**Audit Logging**:

- Every action logged in `material_status_history` table
- Captures: user, timestamp, action type, from/to status, comments
- Immutable log (no deletions, only additions)
- Full history accessible via API endpoint

**Compliance Features**:

- Complete user attribution for all actions
- Timestamp precision to the second
- Mandatory comments for critical actions (rejection, dispensing)
- Historical data retention for regulatory compliance

### Testing and Validation

**Backend Testing**:

```bash
# Test API endpoints using curl or Postman
curl http://localhost:3000/health
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"operator1","password":"password123"}'
```

**Mobile Testing**:

- Test on physical device using Expo Go
- Verify QR scanning functionality
- Test role-based permissions
- Validate stage transitions
- Check inventory updates

**Database Validation**:

```sql
-- Verify tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';

-- Check roles
SELECT * FROM roles;

-- Verify material workflow
SELECT * FROM material_status_history ORDER BY timestamp DESC;
```

### Deployment Considerations

**Production Checklist**:

- [ ] Update `.env` with production database credentials
- [ ] Set strong `JWT_SECRET` (minimum 32 characters)
- [ ] Configure proper CORS origins
- [ ] Enable HTTPS/SSL for API endpoints
- [ ] Set up database backups
- [ ] Configure logging and monitoring
- [ ] Update mobile app API URL to production endpoint
- [ ] Build production mobile app bundles
- [ ] Set up user management interface
- [ ] Configure printer integration

**Security Hardening**:

- Use environment variables for all secrets
- Implement rate limiting on API endpoints
- Enable SQL injection protection (already implemented via parameterized queries)
- Regular security audits and dependency updates
- Implement API request logging and monitoring

### Maintenance and Updates

**Regular Tasks**:

- Monitor database performance and optimize queries
- Review and rotate JWT secrets periodically
- Update dependencies for security patches
- Backup database regularly
- Monitor expiry alerts and inventory levels
- Review audit logs for compliance

**Scaling Considerations**:

- Database connection pooling (already configured)
- API server horizontal scaling with load balancer
- CDN for static assets (if applicable)
- Database read replicas for reporting queries
- Caching layer for frequently accessed data

### Additional Resources

- **Technical Implementation Guide**: See `docs/TECHNICAL_IMPLEMENTATION_GUIDE.md` for complete technical details
- **API Documentation**: See `docs/API_DOCUMENTATION.md`
- **Setup Guide**: See `docs/SETUP_GUIDE.md`
- **Project Summary**: See `PROJECT_SUMMARY.md` for feature overview
- **Quick Start**: See `QUICK_START.md` for rapid setup instructions

## License

Proprietary - Client Project
