# Binary Options Demo Server

This server provides the backend for the binary options trading demo application. It connects to an external data source for real-time price and candlestick data.

## Features

- Real-time price updates from external data source
- Candlestick data for charting
- Binary options trading simulation
- Demo and real account support
- Admin panel for profit rate management
- WebSocket-based real-time communication

## Configuration

The server connects to an external data source at `http://localhost:3000` for price and candlestick data.

### Environment Variables

- `EXTERNAL_DATA_URL` - URL of the external data source (default: `http://localhost:3000`)

## API Endpoints

### REST Endpoints

- `GET /health` - Server health status
- `GET /metrics` - Trading metrics
- `GET /price/:symbol` - Current price for a symbol
- `GET /orderbook/:symbol` - Order book data (placeholder)

### WebSocket Events

#### Client to Server
- `place_trade` - Place a new trade
- `get_balance` - Get account balance
- `list_trades` - Get list of trades
- `get_initial_candles` - Get initial candlestick data
- `health_check` - Check server health
- `admin_login` - Admin authentication
- `update_profit_rates` - Update profit rates

#### Server to Client
- `price_update` - Real-time price updates
- `kline` - Candlestick data updates
- `trade_placed` - Trade placement confirmation
- `trade_resolved` - Trade resolution notification
- `balance` - Account balance updates
- `trade_list` - Updated trade list
- `initial_candles` - Initial candlestick data

## External Data Source API

The server expects the external data source to provide the following endpoints:

- `GET /health` - Health check
- `GET /api/price/:symbol` - Current price for symbol
- `GET /api/candles/:symbol` - Candlestick data for symbol

### Expected Response Formats

#### Price Response
```json
{
  "price": 45000.00
}
```

#### Candles Response
```json
{
  "candles": [
    {
      "time": 1640995200,
      "open": 45000.00,
      "high": 45100.00,
      "low": 44900.00,
      "close": 45050.00,
      "volume": 100.5
    }
  ]
}
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

## Development

For development with auto-restart:
```bash
npm run dev
```

## Trading Logic

- **CALL trades**: Win if price goes up, lose if price goes down
- **PUT trades**: Win if price goes down, lose if price goes up
- **Refund**: If entry and expiry prices are equal
- **Profit rates**: Configurable per symbol (default: BTC 91%, ETH 85%, XRP 80%)

## Admin Access

- Username: `admin`
- Password: `admin123`

Admin can modify profit rates for each trading pair through the admin panel.
