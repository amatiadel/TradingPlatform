# Deposit System Implementation

## Overview

This document describes the complete deposit flow implementation for the binary options trading platform. The system allows real-account users to deposit funds through a secure, admin-approved workflow.

## Features

### ✅ Core Functionality
- **Two-step deposit process**: Create request → Payment instructions → Admin approval
- **Bonus system**: Selected bonus + promotional code bonus
- **Promotional codes**: Server-side validation with usage limits
- **24-hour expiration**: Automatic expiration for incomplete deposits
- **Real-time updates**: Socket.IO integration for live status updates
- **Admin approval workflow**: Manual verification with audit logging
- **No auto-crediting**: Funds only credited after admin approval

### ✅ User Interface
- **Deposit page** (`/deposit`): Two-column layout with payment form and bonus selection
- **Payment instructions** (`/deposit/confirm`): Wallet address, countdown timer, status tracking
- **Latest requests**: Real-time list of user's deposit history
- **Responsive design**: Mobile-friendly with dark theme
- **Accessibility**: Keyboard navigation and ARIA labels

### ✅ Admin Panel
- **Deposit Requests tab**: View and manage all deposit requests
- **Status filtering**: Filter by created, waiting_confirmation, approved, rejected, expired
- **Approve/Reject actions**: With reason tracking and audit logging
- **Real-time notifications**: Socket events for new deposits

## Database Schema

### deposit_requests Table
```sql
CREATE TABLE deposit_requests (
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
  metadata TEXT,
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (adminId) REFERENCES users(id)
);
```

### promo_codes Table
```sql
CREATE TABLE promo_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  bonusPercent INTEGER NOT NULL,
  isActive BOOLEAN DEFAULT 1,
  maxUses INTEGER DEFAULT -1,
  currentUses INTEGER DEFAULT 0,
  validFrom DATETIME DEFAULT CURRENT_TIMESTAMP,
  validUntil DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### User Endpoints
- `POST /api/user/deposit-request` - Create new deposit request
- `PATCH /api/user/deposit-request/:id/mark-paid` - Mark deposit as paid
- `GET /api/user/deposit-requests` - Get user's deposit history
- `GET /api/user/deposit-request/:id` - Get specific deposit details

### Admin Endpoints
- `GET /api/admin/deposit-requests` - List all deposit requests (filterable)
- `PATCH /api/admin/deposit-requests/:id/approve` - Approve deposit
- `PATCH /api/admin/deposit-requests/:id/reject` - Reject deposit

### Promo Code Endpoints
- `GET /api/promo-codes/:code` - Validate promotional code

## Socket Events

### Server → Client
- `user:deposit:approved` - Deposit approved by admin
- `user:deposit:rejected` - Deposit rejected by admin
- `balance:update` - Balance updated after approval

### Server → Admin
- `admin:deposit:waiting_confirmation` - New deposit waiting for approval

## User Flow

### 1. Create Deposit Request
1. User navigates to `/deposit`
2. Selects amount ($10-$50,000)
3. Chooses bonus percentage (0-35%)
4. Optionally enters promotional code
5. Clicks "Deposit" button
6. System validates input and creates deposit request
7. User redirected to `/deposit/confirm?reqId=<id>`

### 2. Payment Instructions
1. User sees payment instructions with wallet address
2. 24-hour countdown timer starts
3. User copies wallet address and sends payment
4. User clicks "I've Paid" button
5. Status changes to "waiting_confirmation"
6. Admin receives real-time notification

### 3. Admin Approval
1. Admin sees deposit in admin panel
2. Admin reviews payment details
3. Admin clicks "Approve" or "Reject"
4. If approved: User's real balance is credited
5. If rejected: User receives notification with reason
6. Audit log records admin action

## Setup Instructions

### 1. Database Migration
The deposit system tables are automatically created when the server starts. No manual migration is required.

### 2. Sample Promo Codes
The system includes these sample promo codes:
- `DEPOSIT20` - 20% bonus (100 uses)
- `WELCOME25` - 25% bonus (50 uses)
- `BONUS30` - 30% bonus (25 uses)

### 3. Testing
Run the test script to verify the complete flow:
```bash
cd server
node test_deposit_flow.js
```

## Security Features

### ✅ Validation
- Server-side amount validation ($10-$50,000)
- Promo code validation with usage limits
- Admin-only approval system
- No auto-crediting of balances

### ✅ Audit Trail
- All admin actions logged in `admin_balance_adjustments` table
- Deposit request history with timestamps
- Admin notes for rejections

### ✅ Rate Limiting
- Promo code usage tracking
- Deposit request limits (configurable)

## Configuration

### Payment Methods
Currently supports:
- USDT (TRC-20) - Min $10, Max $50,000

### Bonus System
- Selected bonus: 0%, 20%, 25%, 30%, 35%
- Promo code bonus: Configurable per code
- Total bonus = Selected bonus + Promo bonus

### Expiration
- Default: 24 hours from creation
- Configurable in server code

## Error Handling

### Common Error Scenarios
1. **Invalid amount**: Must be between $10-$50,000
2. **Expired deposit**: Cannot mark as paid after 24 hours
3. **Invalid promo code**: Code not found or usage limit reached
4. **Already approved**: Cannot approve/reject twice
5. **Insufficient balance**: Admin cannot approve if user balance would go negative

### Error Responses
All API endpoints return consistent error responses:
```json
{
  "error": "Error message description"
}
```

## Monitoring & Logging

### Server Logs
- Deposit creation: `💰 Created deposit request {id} for user {userId}: ${amount} ({bonus}% bonus)`
- Payment marking: `💰 Deposit request {id} marked as paid by user {userId}`
- Admin approval: `💰 Admin {adminId} approved deposit {id} for user {userId}: ${amount}`
- Admin rejection: `❌ Admin {adminId} rejected deposit {id} for user {userId}`

### Database Queries
Monitor these tables for system health:
- `deposit_requests` - Active and historical deposits
- `promo_codes` - Promotional code usage
- `admin_balance_adjustments` - Admin action audit trail

## Troubleshooting

### Common Issues

1. **Deposit not appearing in admin panel**
   - Check if user marked deposit as paid
   - Verify admin is logged in and has proper permissions
   - Check server logs for errors

2. **Balance not updating after approval**
   - Verify admin approval endpoint called successfully
   - Check `admin_balance_adjustments` table for audit log
   - Ensure user is connected to Socket.IO for real-time updates

3. **Promo code not working**
   - Check if code exists and is active
   - Verify usage limits not exceeded
   - Check expiration date

4. **Socket connection issues**
   - Verify client connects to correct server URL
   - Check authentication token is valid
   - Ensure user joins correct Socket.IO rooms

### Debug Commands
```bash
# Check deposit requests
sqlite3 data.db "SELECT * FROM deposit_requests ORDER BY createdAt DESC LIMIT 10;"

# Check promo code usage
sqlite3 data.db "SELECT * FROM promo_codes;"

# Check admin audit log
sqlite3 data.db "SELECT * FROM admin_balance_adjustments ORDER BY createdAt DESC LIMIT 10;"
```

## Future Enhancements

### Planned Features
- Multiple payment methods (Bitcoin, Ethereum, etc.)
- Automated payment verification
- Email notifications
- Advanced bonus tiers
- Deposit limits per user
- KYC integration

### Performance Optimizations
- Database query optimization
- Caching for promo codes
- Rate limiting improvements
- Real-time analytics dashboard

## Support

For issues or questions about the deposit system:
1. Check server logs for error messages
2. Verify database schema is correct
3. Test with the provided test script
4. Review this documentation for configuration details
