-- Migration: Create withdrawal_requests table
-- This table stores all withdrawal requests with their status, amounts, and admin approval tracking

CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  paymentMethod TEXT NOT NULL,
  purse TEXT NOT NULL,
  network TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('created', 'waiting_confirmation', 'approved', 'rejected', 'processing', 'completed', 'failed')),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  approvedAt DATETIME,
  adminId INTEGER,
  adminNote TEXT,
  processedAt DATETIME,
  transactionHash TEXT,
  metadata TEXT, -- JSON field for additional data
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (adminId) REFERENCES users(id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON withdrawal_requests(userId);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_created_at ON withdrawal_requests(createdAt);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_payment_method ON withdrawal_requests(paymentMethod);
