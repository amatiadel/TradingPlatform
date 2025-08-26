const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const axios = require('axios');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(express.static('public'));

// Configuration
const PORT = process.env.PORT || 3000;
const SYMBOLS = ['BTCUSDT', 'ETHUSDT'];
const MAX_CANDLES = 2000;

// Data structures
const priceData = {};
const candles = {};
const wsConnections = {};

// Initialize data structures
SYMBOLS.forEach(symbol => {
  priceData[symbol] = {
    providers: {},
    lastUpdate: null,
    aggregatedPrice: null
  };
  
  candles[symbol] = {
    '1m': [],
    '3m': [],
    '5m': [],
    '15m': [],
    '30m': [],
    '1h': [],
    '2h': [],
    '4h': [],
    '1d': []
  };
});

// WebSocket connection management
function createWebSocketConnection(url, provider) {
  const ws = new WebSocket(url);
  
  ws.on('open', () => {
    console.log(`Connected to ${provider} WebSocket`);
    wsConnections[provider] = ws;
  });
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      handlePriceUpdate(message, provider);
    } catch (error) {
      console.error(`Error parsing ${provider} message:`, error);
    }
  });
  
  ws.on('close', () => {
    console.log(`Disconnected from ${provider} WebSocket`);
    wsConnections[provider] = null;
    
    // Reconnect after 5 seconds
    setTimeout(() => {
      console.log(`Attempting to reconnect to ${provider}...`);
      if (provider === 'binance') {
        createBinanceConnection();
      } else if (provider === 'kraken') {
        createKrakenConnection();
      }
    }, 5000);
  });
  
  ws.on('error', (error) => {
    console.error(`${provider} WebSocket error:`, error);
  });
  
  return ws;
}

// Binance WebSocket connection
function createBinanceConnection() {
  const streams = SYMBOLS.map(symbol => `${symbol.toLowerCase()}@trade`).join('/');
  const url = `wss://stream.binance.com:9443/ws/${streams}`;
  
  const ws = createWebSocketConnection(url, 'binance');
  
  ws.on('open', () => {
    console.log('Subscribed to Binance trade streams');
  });
}

// Kraken WebSocket connection
function createKrakenConnection() {
  const url = 'wss://ws.kraken.com';
  
  const ws = createWebSocketConnection(url, 'kraken');
  
  ws.on('open', () => {
    // Subscribe to trade data
    const subscribeMessage = {
      event: 'subscribe',
      pair: SYMBOLS.map(symbol => symbol.replace('USDT', '/USDT')),
      subscription: {
        name: 'trade'
      }
    };
    
    ws.send(JSON.stringify(subscribeMessage));
    console.log('Subscribed to Kraken trade streams');
  });
}

// Handle price updates from providers
function handlePriceUpdate(message, provider) {
  let symbol, price, volume, timestamp;
  
  if (provider === 'binance') {
    if (message.e === 'trade') {
      symbol = message.s;
      price = parseFloat(message.p);
      volume = parseFloat(message.q);
      timestamp = message.T;
    }
  } else if (provider === 'kraken') {
    if (message[2] === 'trade' && message[1]) {
      const trades = message[1];
      if (trades.length > 0) {
        const lastTrade = trades[trades.length - 1];
        symbol = message[3].replace('/', '');
        price = parseFloat(lastTrade[0]);
        volume = parseFloat(lastTrade[1]);
        timestamp = Math.floor(lastTrade[2] * 1000); // Convert to milliseconds
      }
    }
  }
  
  if (symbol && price && volume && timestamp) {
    updatePriceData(symbol, provider, price, volume, timestamp);
  }
}

// Update price data and aggregate
function updatePriceData(symbol, provider, price, volume, timestamp) {
  if (!priceData[symbol]) return;
  
  priceData[symbol].providers[provider] = {
    price,
    volume,
    timestamp
  };
  
  // Aggregate prices
  aggregatePrices(symbol);
  
  // Update candles
  updateCandles(symbol, price, volume, timestamp);
  
  // Broadcast to WebSocket clients
  broadcastUpdate(symbol);
}

// Aggregate prices using median and weighted average
function aggregatePrices(symbol) {
  const providers = Object.values(priceData[symbol].providers);
  if (providers.length === 0) return;
  
  // Calculate median price
  const prices = providers.map(p => p.price).sort((a, b) => a - b);
  const medianPrice = prices[Math.floor(prices.length / 2)];
  
  // Filter out outliers (>1% deviation from median)
  const validProviders = providers.filter(p => {
    const deviation = Math.abs(p.price - medianPrice) / medianPrice;
    return deviation <= 0.01; // 1%
  });
  
  if (validProviders.length === 0) return;
  
  // Calculate weighted average by volume
  const totalVolume = validProviders.reduce((sum, p) => sum + p.volume, 0);
  const weightedPrice = validProviders.reduce((sum, p) => {
    return sum + (p.price * p.volume);
  }, 0) / totalVolume;
  
  priceData[symbol].aggregatedPrice = weightedPrice;
  priceData[symbol].lastUpdate = Date.now();
}

// Update OHLC candles
function updateCandles(symbol, price, volume, timestamp) {
  const timeframes = ['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '1d'];
  
  timeframes.forEach(timeframe => {
    const candleData = candles[symbol][timeframe];
    let interval; // in milliseconds
    
    switch (timeframe) {
      case '1m': interval = 60 * 1000; break;
      case '3m': interval = 3 * 60 * 1000; break;
      case '5m': interval = 5 * 60 * 1000; break;
      case '15m': interval = 15 * 60 * 1000; break;
      case '30m': interval = 30 * 60 * 1000; break;
      case '1h': interval = 60 * 60 * 1000; break;
      case '2h': interval = 2 * 60 * 60 * 1000; break;
      case '4h': interval = 4 * 60 * 60 * 1000; break;
      case '1d': interval = 24 * 60 * 60 * 1000; break;
      default: return; // Should not happen with defined timeframes
    }
    
    const candleTime = Math.floor(timestamp / interval) * interval;
    
    let currentCandle = candleData[candleData.length - 1];
    
    if (!currentCandle || currentCandle.time !== candleTime) {
      // Create new candle
      currentCandle = {
        time: candleTime,
        open: price,
        high: price,
        low: price,
        close: price,
        volume: volume
      };
      candleData.push(currentCandle);
      
      // Keep only last MAX_CANDLES
      if (candleData.length > MAX_CANDLES) {
        candleData.shift();
      }
      
      // Log candle creation for debugging
      console.log(`Created new ${timeframe} candle for ${symbol}: ${JSON.stringify(currentCandle)}`);
    } else {
      // Update existing candle
      currentCandle.high = Math.max(currentCandle.high, price);
      currentCandle.low = Math.min(currentCandle.low, price);
      currentCandle.close = price;
      currentCandle.volume += volume;
    }
  });
}

// Broadcast updates to WebSocket clients
function broadcastUpdate(symbol) {
  const data = {
    symbol,
    price: priceData[symbol].aggregatedPrice,
    timestamp: priceData[symbol].lastUpdate,
    candles: {
      '1m': candles[symbol]['1m'].slice(-100),
      '3m': candles[symbol]['3m'].slice(-100),
      '5m': candles[symbol]['5m'].slice(-100),
      '15m': candles[symbol]['15m'].slice(-100),
      '30m': candles[symbol]['30m'].slice(-100),
      '1h': candles[symbol]['1h'].slice(-100),
      '2h': candles[symbol]['2h'].slice(-100),
      '4h': candles[symbol]['4h'].slice(-100),
      '1d': candles[symbol]['1d'].slice(-100)
    }
  };
  
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

// REST API endpoints
app.get('/api/price/:symbol', (req, res) => {
  const { symbol } = req.params;
  
  if (!priceData[symbol]) {
    return res.status(404).json({ error: 'Symbol not found' });
  }
  
  res.json({
    symbol,
    price: priceData[symbol].aggregatedPrice,
    timestamp: priceData[symbol].lastUpdate,
    providers: priceData[symbol].providers
  });
});

app.get('/api/candles/:symbol/:timeframe', (req, res) => {
  const { symbol, timeframe } = req.params;
  
  if (!candles[symbol] || !candles[symbol][timeframe]) {
    return res.status(404).json({ error: 'Symbol or timeframe not found' });
  }
  
  const candleData = candles[symbol][timeframe];
  console.log(`API request: ${symbol} ${timeframe} - ${candleData.length} candles available`);
  
  res.json(candleData);
});

app.get('/api/symbols', (req, res) => {
  res.json(SYMBOLS);
});

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('New WebSocket client connected');
  
  // Send initial data
  const initialData = {};
  SYMBOLS.forEach(symbol => {
    initialData[symbol] = {
      price: priceData[symbol].aggregatedPrice,
      timestamp: priceData[symbol].lastUpdate,
      candles: {
        '1m': candles[symbol]['1m'].slice(-100),
        '3m': candles[symbol]['3m'].slice(-100),
        '5m': candles[symbol]['5m'].slice(-100),
        '15m': candles[symbol]['15m'].slice(-100),
        '30m': candles[symbol]['30m'].slice(-100),
        '1h': candles[symbol]['1h'].slice(-100),
        '2h': candles[symbol]['2h'].slice(-100),
        '4h': candles[symbol]['4h'].slice(-100),
        '1d': candles[symbol]['1d'].slice(-100)
      }
    };
  });
  
  ws.send(JSON.stringify({ type: 'initial', data: initialData }));
  
  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server ready`);
  console.log(`REST API available at http://localhost:${PORT}/api`);
  console.log(`Frontend available at http://localhost:${PORT}`);
  
  // Initialize WebSocket connections
  createBinanceConnection();
  createKrakenConnection();
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  
  // Close WebSocket connections
  Object.values(wsConnections).forEach(ws => {
    if (ws) ws.close();
  });
  
  wss.close(() => {
    server.close(() => {
      console.log('Server shutdown complete');
      process.exit(0);
    });
  });
});
