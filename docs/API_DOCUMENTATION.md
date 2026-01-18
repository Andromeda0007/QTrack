# QTrack API Documentation

## Base URL

```
Development: http://localhost:3000/api
Production: https://your-production-api.com/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

---

## Endpoints

### Authentication

#### POST `/auth/login`

Login and get JWT token.

**Request Body:**

```json
{
  "username": "operator1",
  "password": "password123"
}
```

**Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "userId": "uuid",
    "username": "operator1",
    "email": "operator@qtrack.com",
    "fullName": "John Operator",
    "role": "Operator"
  }
}
```

#### GET `/auth/me`

Get current authenticated user info.

**Response:**

```json
{
  "user": {
    "userId": "uuid",
    "username": "operator1",
    "email": "operator@qtrack.com",
    "fullName": "John Operator",
    "role": "Operator",
    "permissions": ["create_material", "move_to_under_test", ...]
  }
}
```

---

### Materials

#### POST `/materials/create`

Create new material and generate QR code. **Requires Operator role.**

**Request Body:**

```json
{
  "itemCode": "ITEM001",
  "itemName": "Raw Material A",
  "batchLotNumber": "BATCH123",
  "grnNumber": "GRN456",
  "receivedTotalQuantity": 100,
  "containerQuantity": 10,
  "supplierName": "Supplier ABC",
  "manufacturerName": "Manufacturer XYZ",
  "dateOfReceipt": "2024-12-15",
  "mfgDate": "2024-01-01",
  "expDate": "2025-12-31"
}
```

**Response:**

```json
{
  "message": "Material created successfully",
  "material": {
    "material_id": "uuid",
    "qr_code": "MAT-20241215-A3F9B2C1",
    "item_code": "ITEM001",
    "current_status": "QUARANTINE",
    "qrCodeImage": "data:image/png;base64,...",
    "qrPayload": "{\"id\":\"MAT-20241215-A3F9B2C1\",\"v\":1}",
    "labelData": {...}
  }
}
```

#### GET `/materials/scan/:qrCode`

Scan QR code and get material details. **All authenticated users can access.**

**Response:**

```json
{
  "material": {...},
  "history": [...],
  "userPermissions": [...],
  "canEdit": true
}
```

#### GET `/materials/:materialId`

Get material by ID. **All authenticated users can access.**

#### GET `/materials/:materialId/history`

Get material audit history. **All authenticated users can access.**

#### POST `/materials/:materialId/sampling`

Move material to Under Test stage. **Requires Operator role.**

**Request Body:**

```json
{
  "comments": "Sample withdrawn for testing"
}
```

#### POST `/materials/:materialId/approve`

Approve material. **Requires Operator role.**

**Request Body:**

```json
{
  "retestDate": "2025-01-15",
  "comments": "Material meets specifications"
}
```

#### POST `/materials/:materialId/reject`

Reject material. **Requires Operator role.**

**Request Body:**

```json
{
  "rejectionReason": "Failed quality tests",
  "comments": "Additional remarks"
}
```

#### PUT `/materials/:materialId/rack`

Update rack number. **Requires Operator role.**

**Request Body:**

```json
{
  "rackNumber": "RACK-A-12"
}
```

#### POST `/materials/:materialId/dispense`

Dispense material to manufacturing. **Requires Operator role.**

**Request Body:**

```json
{
  "issuedQuantity": 50,
  "issuedToProductBatch": "PRODUCT-BATCH-001",
  "dispensingMethod": "FIFO",
  "comments": "Issued to production"
}
```

#### GET `/materials/:materialId/qr-label`

Get QR label data for printing. **All authenticated users can access.**

---

### Inventory

#### POST `/inventory/inward`

Record inventory inward transaction. **Requires Operator role.**

**Request Body:**

```json
{
  "materialId": "uuid",
  "quantity": 10,
  "transactionDate": "2024-12-15",
  "remarks": "Additional stock received"
}
```

#### POST `/inventory/outward`

Record inventory outward transaction. **Requires Operator role.**

**Request Body:**

```json
{
  "materialId": "uuid",
  "quantity": 5,
  "transactionDate": "2024-12-15",
  "remarks": "Stock adjustment"
}
```

#### GET `/inventory/expiry-alerts`

Get materials approaching expiry. **All authenticated users can access.**

**Query Parameters:**

- `days` (optional): Number of days ahead to check (default: 30)

**Response:**

```json
{
  "alerts": [
    {
      "material_id": "uuid",
      "item_name": "Raw Material A",
      "exp_date": "2024-12-20",
      "days_until_expiry": 5,
      ...
    }
  ],
  "daysBefore": 30
}
```

---

## Material Status Flow

```
QUARANTINE → UNDER_TEST → APPROVED/REJECTED → DISPENSED
```

- Sequential flow only (cannot skip stages)
- Rejected materials cannot proceed further
- Only APPROVED materials can be dispensed

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message here"
}
```

**Status Codes:**

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error
