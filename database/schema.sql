-- QTrack Database Schema
-- PostgreSQL 14+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ROLES TABLE
-- ============================================
CREATE TABLE roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default roles
INSERT INTO roles (role_name, description) VALUES
('Operator', 'Full permissions: create, edit, move stages, approve/reject, dispense'),
('Viewer', 'Read-only access: scan QR, view details, view history');

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role_id INTEGER NOT NULL REFERENCES roles(role_id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- MATERIALS TABLE
-- ============================================
CREATE TYPE material_status AS ENUM (
    'QUARANTINE',
    'UNDER_TEST',
    'APPROVED',
    'REJECTED',
    'DISPENSED'
);

CREATE TABLE materials (
    material_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    qr_code VARCHAR(100) UNIQUE NOT NULL,
    item_code VARCHAR(100) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    batch_lot_number VARCHAR(100) NOT NULL,
    grn_number VARCHAR(100) NOT NULL,
    received_total_quantity DECIMAL(10, 2) NOT NULL,
    container_quantity DECIMAL(10, 2) NOT NULL,
    supplier_name VARCHAR(255) NOT NULL,
    manufacturer_name VARCHAR(255) NOT NULL,
    date_of_receipt DATE NOT NULL,
    mfg_date DATE,
    exp_date DATE,
    current_status material_status DEFAULT 'QUARANTINE',
    rack_number VARCHAR(50),
    remaining_quantity DECIMAL(10, 2) NOT NULL,
    total_dispensed_quantity DECIMAL(10, 2) DEFAULT 0,
    created_by_user_id UUID NOT NULL REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for QR code lookups
CREATE INDEX idx_materials_qr_code ON materials(qr_code);
CREATE INDEX idx_materials_status ON materials(current_status);
CREATE INDEX idx_materials_exp_date ON materials(exp_date);

-- ============================================
-- MATERIAL STATUS HISTORY TABLE
-- ============================================
CREATE TYPE action_type AS ENUM (
    'CREATED',
    'SAMPLING',
    'APPROVAL',
    'REJECTION',
    'DISPENSING',
    'COMMENT',
    'RACK_UPDATE',
    'STATUS_CHANGE'
);

CREATE TABLE material_status_history (
    history_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_id UUID NOT NULL REFERENCES materials(material_id) ON DELETE CASCADE,
    from_status material_status,
    to_status material_status NOT NULL,
    action_type action_type NOT NULL,
    performed_by_user_id UUID NOT NULL REFERENCES users(user_id),
    comments TEXT,
    rejection_reason TEXT,
    sampling_date_time TIMESTAMP,
    retest_date DATE,
    issued_to_product_batch VARCHAR(100),
    issued_quantity DECIMAL(10, 2),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_history_material_id ON material_status_history(material_id);
CREATE INDEX idx_history_timestamp ON material_status_history(timestamp DESC);

-- ============================================
-- INVENTORY TRANSACTIONS TABLE
-- ============================================
CREATE TYPE transaction_type AS ENUM ('INWARD', 'OUTWARD');

CREATE TABLE inventory_transactions (
    transaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_id UUID NOT NULL REFERENCES materials(material_id) ON DELETE CASCADE,
    transaction_type transaction_type NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    transaction_date DATE NOT NULL,
    performed_by_user_id UUID NOT NULL REFERENCES users(user_id),
    remarks TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_inventory_material_id ON inventory_transactions(material_id);
CREATE INDEX idx_inventory_date ON inventory_transactions(transaction_date DESC);

-- ============================================
-- EXPIRY ALERTS TABLE
-- ============================================
CREATE TABLE expiry_alerts (
    alert_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_id UUID NOT NULL REFERENCES materials(material_id) ON DELETE CASCADE,
    expiry_date DATE NOT NULL,
    alert_days_before INTEGER NOT NULL,
    is_notified BOOLEAN DEFAULT FALSE,
    notified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_expiry_material_id ON expiry_alerts(material_id);
CREATE INDEX idx_expiry_date ON expiry_alerts(expiry_date);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for materials table
CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON materials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for users table
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically log status changes
CREATE OR REPLACE FUNCTION log_material_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.current_status IS DISTINCT FROM NEW.current_status THEN
        INSERT INTO material_status_history (
            material_id,
            from_status,
            to_status,
            action_type,
            performed_by_user_id,
            timestamp
        ) VALUES (
            NEW.material_id,
            OLD.current_status,
            NEW.current_status,
            CASE
                WHEN NEW.current_status = 'UNDER_TEST' THEN 'SAMPLING'
                WHEN NEW.current_status = 'APPROVED' THEN 'APPROVAL'
                WHEN NEW.current_status = 'REJECTED' THEN 'REJECTION'
                WHEN NEW.current_status = 'DISPENSED' THEN 'DISPENSING'
                ELSE 'STATUS_CHANGE'
            END,
            NEW.updated_by_user_id, -- This would need to be added to materials table
            CURRENT_TIMESTAMP
        );
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Note: For proper audit trail, we'll handle status changes in application logic
-- rather than triggers, to capture user context properly

