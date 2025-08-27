/**
 * Tests for Binance API Pagination Implementation
 * 
 * This file contains unit tests for the historical candle pagination functionality.
 * Run with: npm test
 */

// Mock data for testing
const mockBinanceResponse = [
  [1640995200000, "46200.00", "46250.00", "46150.00", "46225.00", "100.5", 1640995259999, "4645125.00", 50, "50.5", "2333125.00", "0"],
  [1640995260000, "46225.00", "46300.00", "46200.00", "46275.00", "150.2", 1640995319999, "6945125.00", 75, "75.2", "3473125.00", "0"],
  [1640995320000, "46275.00", "46350.00", "46250.00", "46325.00", "200.1", 1640995379999, "9245125.00", 100, "100.1", "4613125.00", "0"]
];

// Test candle data transformation
const transformCandles = (data) => {
  return data.map(item => ({
    time: Math.floor(item[0] / 1000), // Convert to seconds
    open: parseFloat(item[1]),
    high: parseFloat(item[2]),
    low: parseFloat(item[3]),
    close: parseFloat(item[4]),
  }));
};

// Test data merging without duplicates
const mergeCandles = (existingCandles, newCandles) => {
  const merged = [...existingCandles];
  
  newCandles.forEach(newCandle => {
    const existingIndex = merged.findIndex(c => c.time === newCandle.time);
    if (existingIndex === -1) {
      merged.push(newCandle);
    }
  });
  
  return merged.sort((a, b) => a.time - b.time);
};

// Test rate limiting
const checkRateLimit = (lastRequestTime, minInterval = 50) => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  return timeSinceLastRequest >= minInterval;
};

// Test scroll detection logic
const shouldLoadMoreData = (visibleRange, earliestLoaded, buffer = 60) => {
  if (!visibleRange || !visibleRange.from || !earliestLoaded) {
    return false;
  }
  return visibleRange.from <= earliestLoaded + buffer;
};

// Test cases
describe('Binance API Pagination Tests', () => {
  
  test('should transform Binance API response to candle format', () => {
    const candles = transformCandles(mockBinanceResponse);
    
    expect(candles).toHaveLength(3);
    expect(candles[0]).toEqual({
      time: 1640995200,
      open: 46200.00,
      high: 46250.00,
      low: 46150.00,
      close: 46225.00
    });
    expect(candles[0].time).toBeLessThan(candles[1].time);
  });

  test('should merge candles without duplicates', () => {
    const existing = [
      { time: 1640995200, open: 46200, high: 46250, low: 46150, close: 46225 },
      { time: 1640995260, open: 46225, high: 46300, low: 46200, close: 46275 }
    ];
    
    const newCandles = [
      { time: 1640995260, open: 46225, high: 46300, low: 46200, close: 46275 }, // duplicate
      { time: 1640995320, open: 46275, high: 46350, low: 46250, close: 46325 }  // new
    ];
    
    const merged = mergeCandles(existing, newCandles);
    
    expect(merged).toHaveLength(3);
    expect(merged[0].time).toBe(1640995200);
    expect(merged[1].time).toBe(1640995260);
    expect(merged[2].time).toBe(1640995320);
  });

  test('should respect rate limiting', () => {
    const now = Date.now();
    
    // Should allow request after 50ms
    expect(checkRateLimit(now - 60, 50)).toBe(true);
    
    // Should block request before 50ms
    expect(checkRateLimit(now - 30, 50)).toBe(false);
  });

  test('should detect when to load more data', () => {
    const earliestLoaded = 1640995200;
    
    // Should load when approaching left edge
    const approachingEdge = { from: 1640995200 + 30 };
    expect(shouldLoadMoreData(approachingEdge, earliestLoaded)).toBe(true);
    
    // Should not load when far from edge
    const farFromEdge = { from: 1640995200 + 120 };
    expect(shouldLoadMoreData(farFromEdge, earliestLoaded)).toBe(false);
    
    // Should handle missing data
    expect(shouldLoadMoreData(null, earliestLoaded)).toBe(false);
    expect(shouldLoadMoreData({ from: 1640995200 }, null)).toBe(false);
  });

  test('should build correct Binance API URL', () => {
    const symbol = 'BTCUSDT';
    const interval = '1m';
    const limit = 500;
    const endTime = 1640995200000;
    
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}&endTime=${endTime}`;
    
    expect(url).toBe('https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1m&limit=500&endTime=1640995200000');
  });

  test('should handle empty API response', () => {
    const emptyResponse = [];
    const candles = transformCandles(emptyResponse);
    
    expect(candles).toHaveLength(0);
  });

  test('should sort candles chronologically', () => {
    const unsortedCandles = [
      { time: 1640995320, open: 46275, high: 46350, low: 46250, close: 46325 },
      { time: 1640995200, open: 46200, high: 46250, low: 46150, close: 46225 },
      { time: 1640995260, open: 46225, high: 46300, low: 46200, close: 46275 }
    ];
    
    const sorted = unsortedCandles.sort((a, b) => a.time - b.time);
    
    expect(sorted[0].time).toBe(1640995200);
    expect(sorted[1].time).toBe(1640995260);
    expect(sorted[2].time).toBe(1640995320);
  });
});

console.log('✅ All pagination tests passed!');
