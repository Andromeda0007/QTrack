-- Seed data for QTrack
-- Run this after schema.sql to create initial users

-- Admin users (pre-approved)
-- Ankit Kumar: username=Andromeda, password=pass-ankit
INSERT INTO users (username, email, password_hash, full_name, role_id, account_status) VALUES
('Andromeda', 'ankit.kumar@gmail.com', '$2a$10$S6pBilEL0WxOu9Ju7U/ztOjzLsYYIO6JEvouiu8QF7SpXWsIIxamO', 'Ankit Kumar', 3, 'APPROVED')
ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash, account_status = EXCLUDED.account_status;

-- Navjot Singh: username=Believix, password=pass-navjot
INSERT INTO users (username, email, password_hash, full_name, role_id, account_status) VALUES
('Believix', 'navjot.singh@gmail.com', '$2a$10$fX5JMZShh6I3tx/t7K8NYOxAW8fPjZpvVUJzwnLCreKPyfVBVDn5.', 'Navjot Singh', 3, 'APPROVED')
ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash, account_status = EXCLUDED.account_status;

-- Test users (pre-approved for testing)
-- Operator user: username=operator1, password=test123
INSERT INTO users (username, email, password_hash, full_name, role_id, account_status) VALUES
('operator1', 'operator@qtrack.com', '$2a$10$SPP8gnF5G5IZmkxDBtPS4OHWKeOu.gG76tagTaIxZ7nJhIveVXKLO', 'John Operator', 1, 'APPROVED')
ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash, account_status = EXCLUDED.account_status;

-- Viewer user: username=viewer1, password=test123
INSERT INTO users (username, email, password_hash, full_name, role_id, account_status) VALUES
('viewer1', 'viewer@qtrack.com', '$2a$10$SPP8gnF5G5IZmkxDBtPS4OHWKeOu.gG76tagTaIxZ7nJhIveVXKLO', 'Jane Viewer', 2, 'APPROVED')
ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash, account_status = EXCLUDED.account_status;


