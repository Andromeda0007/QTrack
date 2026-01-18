-- Seed data for QTrack
-- Run this after schema.sql to create test users

-- Insert test users (password: "password123" hashed with bcrypt)
-- You should change these passwords in production!

-- Operator user
INSERT INTO users (username, email, password_hash, full_name, role_id) VALUES
('operator1', 'operator@qtrack.com', '$2a$10$rOzJqZqZqZqZqZqZqZqZqOqZqZqZqZqZqZqZqZqZqZqZqZqZqZq', 'John Operator', 1);

-- Viewer user
INSERT INTO users (username, email, password_hash, full_name, role_id) VALUES
('viewer1', 'viewer@qtrack.com', '$2a$10$rOzJqZqZqZqZqZqZqZqZqOqZqZqZqZqZqZqZqZqZqZqZqZqZqZq', 'Jane Viewer', 2);

-- Note: The password hashes above are placeholders.
-- In production, use bcrypt to hash actual passwords:
-- const bcrypt = require('bcryptjs');
-- const hash = await bcrypt.hash('password123', 10);


