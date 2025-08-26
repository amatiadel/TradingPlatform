# Trading Price Feed Service

A real-time cryptocurrency price feed service that aggregates data from multiple exchanges (Binance and Kraken) and provides live candlestick charts using TradingView's Lightweight Charts library.

## Features

- **Real-time Price Aggregation**: Combines price data from Binance and Kraken WebSocket APIs
- **Smart Price Filtering**: Uses median-based outlier detection (>1% deviation) and volume-weighted averaging
- **OHLC Candlestick Generation**: Creates 1-second and 1-minute candles with up to 2000 historical candles in memory
- **WebSocket Broadcasting**: Real-time updates to connected clients
- **REST API**: Historical data endpoints for chart initialization
- **Beautiful Frontend**: Modern trading interface with TradingView charts
- **Automatic Reconnection**: Robust WebSocket connection management
- **Production Ready**: Clean, modular code with proper error handling

## Supported Symbols

- **BTCUSDT** (Bitcoin/USDT)
- **ETHUSDT** (Ethereum/USDT)

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Installation

1. **Clone or download the project files**

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the server**:
   ```bash
   npm start
   ```

   For development with auto-restart:
   ```bash
   npm run dev
   ```

4. **Open your browser** and navigate to:
   ```
   http://localhost:3000
   ```

## API Endpoints

### REST API

#### Get Current Price
```
GET /api/price/:symbol
```

**Response:**
```json
{
  "symbol": "BTCUSDT",
  "price": 43250.50,
  "timestamp": 1703123456789,
  "providers": {
    "binance": {
      "price": 43250.00,
      "volume": 0.5,
      "timestamp": 1703123456789
    },
    "kraken": {
      "price": 43251.00,
      "volume": 0.3,
      "timestamp": 1703123456789
    }
  }
}
```

#### Get Historical Candles
```
GET /api/candles/:symbol/:timeframe
```

**Parameters:**
- `symbol`: BTCUSDT or ETHUSDT
- `timeframe`: 1s or 1m

**Response:**
```json
[
  {
    "time": 1703123400000,
    "open": 43200.00,
    "high": 43250.00,
    "low": 43150.00,
    "close": 43225.00,
    "volume": 1.5
  }
]
```

#### Get Available Symbols
```
GET /api/symbols
```

**Response:**
```json
["BTCUSDT", "ETHUSDT"]
```

### WebSocket API

Connect to the WebSocket server at `ws://localhost:3000` to receive real-time updates.

#### Message Format

**Initial Data (on connection):**
```json
{
  "type": "initial",
  "data": {
    "BTCUSDT": {
      "price": 43250.50,
      "timestamp": 1703123456789,
      "candles": {
        "1s": [...],
        "1m": [...]
      }
    },
    "ETHUSDT": {
      "price": 2650.25,
      "timestamp": 1703123456789,
      "candles": {
        "1s": [...],
        "1m": [...]
      }
    }
  }
}
```

**Real-time Updates:**
```json
{
  "symbol": "BTCUSDT",
  "price": 43250.50,
  "timestamp": 1703123456789,
  "candles": {
    "1s": [...],
    "1m": [...]
  }
}
```

## Architecture

### Backend Components

1. **WebSocket Connections**: Manages connections to Binance and Kraken APIs
2. **Price Aggregation**: Implements median-based outlier filtering and volume-weighted averaging
3. **Candlestick Generation**: Creates OHLC candles for 1s and 1m timeframes
4. **Data Broadcasting**: Sends real-time updates to connected clients
5. **REST API**: Provides historical data access

### Frontend Components

1. **TradingView Charts**: Professional-grade candlestick charts
2. **Real-time Updates**: WebSocket connection for live data
3. **Timeframe Switching**: Toggle between 1s and 1m views
4. **Price Display**: Live price updates with color-coded changes
5. **Connection Status**: Visual indicator of WebSocket connection state

## Price Aggregation Logic

1. **Median Calculation**: Computes median price from all providers
2. **Outlier Filtering**: Removes prices that deviate >1% from median
3. **Volume Weighting**: Calculates weighted average based on trade volume
4. **Real-time Updates**: Broadcasts aggregated price to all clients

## Configuration

### Environment Variables

- `PORT`: Server port (default: 3000)

### Customization

To add more symbols, modify the `SYMBOLS` array in `server.js`:

```javascript
const SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'ADAUSDT', 'DOTUSDT'];
```

To change the maximum number of candles stored:

```javascript
const MAX_CANDLES = 5000; // Default: 2000
```

## Error Handling

- **WebSocket Reconnection**: Automatic reconnection with exponential backoff
- **Provider Failures**: Graceful handling of individual exchange failures
- **Data Validation**: Robust parsing and validation of incoming data
- **Client Disconnections**: Clean handling of client WebSocket disconnections

## Logging

The server logs important events:
- WebSocket connections/disconnections
- Price updates and aggregations
- Error conditions
- Client connections

## Performance Considerations

- **Memory Management**: Limits historical data to prevent memory leaks
- **Efficient Broadcasting**: Only sends updates when data changes
- **Connection Pooling**: Reuses WebSocket connections
- **Data Compression**: Minimal payload sizes for WebSocket messages

## Security Notes

- **CORS Enabled**: Configured for development use
- **Input Validation**: All inputs are validated and sanitized
- **Rate Limiting**: Consider adding rate limiting for production use
- **HTTPS**: Use HTTPS in production environments

## Troubleshooting

### Common Issues

1. **No price data appearing**:
   - Check console for WebSocket connection errors
   - Verify internet connectivity
   - Ensure exchanges are accessible

2. **Charts not updating**:
   - Check browser console for JavaScript errors
   - Verify WebSocket connection status
   - Refresh the page

3. **High memory usage**:
   - Reduce `MAX_CANDLES` value
   - Monitor for memory leaks in long-running instances

### Debug Mode

Enable debug logging by setting the environment variable:
```bash
DEBUG=* npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the console logs
3. Open an issue with detailed error information

---

**Note**: This is a demonstration project. For production use, consider adding authentication, rate limiting, and additional security measures.
