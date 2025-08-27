-- Migration: Create deposit_requests table
-- This table stores all deposit requests with their status, amounts, bonuses, and admin approval tracking

CREATE TABLE IF NOT EXISTS deposit_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  selectedBonusPercent INTEGER DEFAULT 0,
  promoCode TEXT,
  promoBonusPercent INTEGER DEFAULT 0,
  totalBonusPercent INTEGER NOT NULL,
  bonusAmount DECIMAL(12,2) NOT NULL,
  finalTotal DECIMAL(12,2) NOT NULL,
  paymentMethod TEXT NOT NULL,
  address TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('created', 'paid_pending', 'waiting_confirmation', 'approved', 'rejected', 'expired')),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  paidAt DATETIME,
  expiresAt DATETIME NOT NULL,
  approvedAt DATETIME,
  adminId INTEGER,
  adminNote TEXT,
  metadata TEXT, -- JSON field for additional data
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (adminId) REFERENCES users(id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_deposit_requests_user_id ON deposit_requests(userId);
CREATE INDEX IF NOT EXISTS idx_deposit_requests_status ON deposit_requests(status);
CREATE INDEX IF NOT EXISTS idx_deposit_requests_created_at ON deposit_requests(createdAt);
CREATE INDEX IF NOT EXISTS idx_deposit_requests_expires_at ON deposit_requests(expiresAt);

-- Create promo_codes table for managing promotional codes
CREATE TABLE IF NOT EXISTS promo_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  bonusPercent INTEGER NOT NULL,
  isActive BOOLEAN DEFAULT 1,
  maxUses INTEGER DEFAULT -1, -- -1 means unlimited
  currentUses INTEGER DEFAULT 0,
  validFrom DATETIME DEFAULT CURRENT_TIMESTAMP,
  validUntil DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert some sample promo codes
INSERT OR IGNORE INTO promo_codes (code, bonusPercent, maxUses, validUntil) VALUES
('DEPOSIT20', 20, 100, '2025-12-31 23:59:59'),
('WELCOME25', 25, 50, '2025-12-31 23:59:59'),
('BONUS30', 30, 25, '2025-12-31 23:59:59');

-- Create index for promo codes
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(isActive);
