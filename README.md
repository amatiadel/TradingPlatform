# Binary Options Trading Platform

A comprehensive binary options trading platform with real-time trading, user management, and admin controls.

## Features

- **Real-time Trading**: Place binary options trades with live price feeds
- **User Management**: Multi-user system with isolated data per user
- **Admin Panel**: Comprehensive admin controls for user and trading pair management
- **Balance Management**: Demo and real account balance tracking
- **Trade History**: Complete trade history with detailed analytics
- **Responsive Design**: Modern UI that works on desktop and mobile
- **Socket.IO Integration**: Real-time updates and notifications

## Tech Stack

- **Frontend**: React.js with Vite
- **Backend**: Node.js with Express
- **Database**: SQLite
- **Real-time**: Socket.IO
- **Authentication**: JWT tokens
- **Styling**: CSS with modern design patterns

## Project Structure

```
binary-options-demo/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/         # Page components
│   │   ├── utils/         # Utility functions
│   │   └── ...
│   └── package.json
├── server/                # Node.js backend
│   ├── routes/           # API routes
│   ├── migrations/       # Database migrations
│   └── ...
└── CHANGELOG.md          # Project changelog
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd binary-options-demo
   ```

2. **Install dependencies**
   ```bash
   # Install client dependencies
   cd client
   npm install
   
   # Install server dependencies
   cd ../server
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy example environment file
   cp server/.env.example server/.env
   
   # Edit .env with your configuration
   ```

4. **Start the development servers**
   ```bash
   # Start backend server (from server directory)
   npm start
   
   # Start frontend (from client directory)
   npm run dev
   ```

## Usage

1. **Access the application** at `http://localhost:5173`
2. **Create an account** or use existing demo credentials
3. **Switch between demo and real accounts** using the account switcher
4. **Place trades** on available trading pairs
5. **Monitor active trades** with real-time countdowns
6. **View trade history** and performance analytics

## Admin Features

- **User Management**: View all users and their balances
- **Balance Adjustment**: Modify user demo/real balances
- **Trading Pair Management**: Configure available trading pairs
- **Audit Trail**: Complete history of admin actions

## API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration

### User Data
- `GET /api/user/balance` - Get user balances
- `GET /api/user/trades` - Get user trades
- `PATCH /api/user/balance` - Update user balance

### Admin (Admin only)
- `GET /api/admin/users` - Get all users
- `PATCH /api/admin/users/:id/balance` - Adjust user balance

## Development

### Database Schema

The application uses SQLite with the following main tables:
- `users` - User accounts and balances
- `trades` - Trade history and active trades
- `admin_balance_adjustments` - Audit trail for balance changes

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is for educational and demonstration purposes.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for detailed version history and recent updates.
