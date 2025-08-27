# Binary Options Demo Client

A React-based trading interface for binary options with real-time price data and charting capabilities.

## Features

- Real-time price updates via WebSocket
- Interactive candlestick charts using lightweight-charts
- Binary options trading simulation
- User authentication and account management
- Responsive design with modern UI

## Binance API Pagination Implementation

### Overview

The trading chart now supports infinite scrolling for historical candles using Binance API pagination. This allows users to scroll back in time and automatically load older candlestick data without any manual intervention.

### Key Features

1. **Initial Load**: Loads 500 latest candles when the chart is first displayed
2. **Lazy Loading**: Automatically loads older candles when user scrolls left
3. **Real-time Updates**: WebSocket stream continues providing live candle updates
4. **Rate Limiting**: Respects Binance API limits (1200 requests/minute)
5. **Duplicate Prevention**: Merges new data with existing candles without duplicates

### Implementation Details

#### API Endpoint
Uses Binance Kline endpoint with pagination parameters:
```
GET /api/v3/klines?symbol=BTCUSDT&interval=1m&limit=500&endTime=...
```

#### Scroll Detection
- Monitors chart's visible time range changes
- Detects when user approaches the left edge (earliest loaded data)
- Uses 60-second buffer to trigger loading before reaching the edge

#### Throttling
- Scroll events are throttled to 300ms to prevent API spam
- Rate limiting ensures minimum 50ms between API requests
- Prevents concurrent requests with loading state management

#### Data Management
- Maintains complete candle dataset in memory
- Merges new historical candles with existing data
- Sorts candles chronologically to maintain proper order
- Updates chart with complete dataset after each merge

### User Experience

1. **Visual Feedback**: Orange loading indicator appears when fetching historical data
2. **Seamless Scrolling**: No interruption to chart interaction during loading
3. **Automatic Detection**: No manual refresh needed - data loads automatically
4. **Performance**: Efficient data merging and chart updates

### Technical Flow

1. User scrolls left in the chart
2. `handleTimeScaleVisibleRangeChange()` detects the scroll
3. Checks if approaching earliest loaded data (with 60s buffer)
4. Throttles the request (300ms delay)
5. Calls `loadHistoricalCandles()` with appropriate `endTime`
6. Fetches data from Binance API
7. Merges new candles with existing data
8. Updates chart with complete dataset
9. Real-time WebSocket updates continue working

### Error Handling

- Network errors are caught and displayed to user
- Rate limiting prevents API abuse
- Duplicate prevention ensures data integrity
- Loading states prevent concurrent requests

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Dependencies

- React 18.2.0
- lightweight-charts 4.2.3
- socket.io-client 4.8.0
- react-router-dom 7.8.2
