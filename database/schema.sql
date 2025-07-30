-- DataVault Database Schema
-- PostgreSQL database for email alias management

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified BOOLEAN DEFAULT false,
    verification_token VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Aliases table
CREATE TABLE aliases (
    alias VARCHAR(8) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    domain VARCHAR(50) DEFAULT 'datavlt.io',
    is_active BOOLEAN DEFAULT true,
    email_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used TIMESTAMP WITH TIME ZONE
);

-- Email activity log (optional for analytics)
CREATE TABLE email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alias VARCHAR(8) NOT NULL REFERENCES aliases(alias),
    sender_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500),
    forwarded_to VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'delivered', -- delivered, failed, bounced
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_aliases_user_id ON aliases(user_id);
CREATE INDEX idx_aliases_active ON aliases(is_active) WHERE is_active = true;
CREATE INDEX idx_aliases_last_used ON aliases(last_used);
CREATE INDEX idx_email_logs_alias ON email_logs(alias);
CREATE INDEX idx_email_logs_created_at ON email_logs(created_at);
CREATE INDEX idx_users_email ON users(email);

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data for testing (remove in production)
INSERT INTO users (email, email_verified) VALUES 
    ('marc@marc.com', true);

-- Get the user ID for sample alias
INSERT INTO aliases (alias, user_id) VALUES 
    ('a7b3x9k2', (SELECT id FROM users WHERE email = 'marc@marc.com'));