const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const axios = require('axios');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const server = http.createServer(app);
const io = new socketIo.Server(server, { cors: { origin: "*" } });

// JWT Secret - In production, use environment variable
const JWT_SECRET = 'your-super-secret-jwt-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Database setup
const db = new sqlite3.Database('./data.db');

// Initialize database tables with proper schema migration
db.serialize(() => {
  // First, check if the users table exists and get its current schema
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'", (err, tableExists) => {
    if (!tableExists) {
      // Create new users table with complete schema
      db.run(`CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        isAdmin BOOLEAN DEFAULT 0,
        demoBalance REAL DEFAULT 10000,
        realBalance REAL DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) {
          console.error('❌ Error creating users table:', err);
        } else {
          console.log('✅ Users table created with complete schema');
          // Create admin user
          const hashedPassword = bcrypt.hashSync('admin123', 10);
          db.run("INSERT INTO users (username, password, isAdmin) VALUES (?, ?, ?)", 
            ['admin', hashedPassword, 1], (err) => {
              if (err) {
                console.error('❌ Error creating admin user:', err);
              } else {
                console.log('✅ Admin user created');
              }
            });
        }
      });
    } else {
      // Table exists, check and add missing columns
      db.all("PRAGMA table_info(users)", (err, columns) => {
        if (err) {
          console.error('❌ Error checking table schema:', err);
          return;
        }
        
        const columnNames = columns.map(col => col.name);
        console.log('📋 Current users table columns:', columnNames);
        
        // Add missing columns
        if (!columnNames.includes('password')) {
          db.run("ALTER TABLE users ADD COLUMN password TEXT", (err) => {
            if (err) console.error('❌ Error adding password column:', err);
            else console.log('✅ Added password column');
          });
        }
        
        if (!columnNames.includes('isAdmin')) {
          db.run("ALTER TABLE users ADD COLUMN isAdmin BOOLEAN DEFAULT 0", (err) => {
            if (err) console.error('❌ Error adding isAdmin column:', err);
            else console.log('✅ Added isAdmin column');
          });
        }
        
        if (!columnNames.includes('demoBalance')) {
          db.run("ALTER TABLE users ADD COLUMN demoBalance REAL DEFAULT 10000", (err) => {
            if (err) console.error('❌ Error adding demoBalance column:', err);
            else console.log('✅ Added demoBalance column');
          });
        }
        
        if (!columnNames.includes('realBalance')) {
          db.run("ALTER TABLE users ADD COLUMN realBalance REAL DEFAULT 0", (err) => {
            if (err) console.error('❌ Error adding realBalance column:', err);
            else console.log('✅ Added realBalance column');
          });
        }
        
        if (!columnNames.includes('createdAt')) {
          db.run("ALTER TABLE users ADD COLUMN createdAt DATETIME DEFAULT CURRENT_TIMESTAMP", (err) => {
            if (err) console.error('❌ Error adding createdAt column:', err);
            else console.log('✅ Added createdAt column');
          });
        }
        
        // Migrate existing users to have proper default values
        db.all("SELECT * FROM users", (err, users) => {
          if (err) {
            console.error('❌ Error fetching users for migration:', err);
          } else {
            console.log(`📋 Found ${users.length} existing users to migrate`);
            
            users.forEach(user => {
              // Set default values for users missing required fields
              const updates = [];
              const values = [];
              
              if (user.password === null || user.password === undefined) {
                updates.push("password = ?");
                values.push(bcrypt.hashSync('default123', 10)); // Temporary password
              }
              
              if (user.isAdmin === null || user.isAdmin === undefined) {
                updates.push("isAdmin = ?");
                values.push(0);
              }
               
               if (user.demoBalance === null || user.demoBalance === undefined) {
                 updates.push("demoBalance = ?");
                 values.push(10000);
               }
               
               if (user.realBalance === null || user.realBalance === undefined) {
                 updates.push("realBalance = ?");
                 values.push(0);
               }
               
               if (user.createdAt === null || user.createdAt === undefined) {
                 updates.push("createdAt = ?");
                 values.push(new Date().toISOString());
               }
               
               if (updates.length > 0) {
                 values.push(user.id);
                 db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values, (err) => {
                   if (err) {
                     console.error(`❌ Error migrating user ${user.username}:`, err);
                   } else {
                     console.log(`✅ Migrated user ${user.username}`);
                   }
                 });
               }
             });
           }
         });
         
         // Check if admin user exists and create if not
         db.get("SELECT * FROM users WHERE username = 'admin'", (err, row) => {
           if (!row) {
             const hashedPassword = bcrypt.hashSync('admin123', 10);
             db.run("INSERT INTO users (username, password, isAdmin) VALUES (?, ?, ?)", 
               ['admin', hashedPassword, 1], (err) => {
                 if (err) {
                   console.error('❌ Error creating admin user:', err);
                 } else {
                   console.log('✅ Admin user created');
                 }
               });
           } else {
             console.log('✅ Admin user already exists');
           }
         });
      });
    }
  });
  
  // Create trades table for user-specific trade storage
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='trades'", (err, tableExists) => {
    if (!tableExists) {
      db.run(`CREATE TABLE trades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        symbol TEXT NOT NULL,
        side TEXT NOT NULL,
        amount REAL NOT NULL,
        duration INTEGER NOT NULL,
        entry_price REAL NOT NULL,
        placed_time INTEGER NOT NULL,
        expiry_time INTEGER NOT NULL,
        result TEXT,
        expiry_price REAL,
        payout_amount REAL,
        account_type TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )`, (err) => {
        if (err) {
          console.error('❌ Error creating trades table:', err);
        } else {
          console.log('✅ Trades table created with user isolation');
        }
      });
    } else {
      console.log('✅ Trades table already exists');
    }
  });

  // Create admin_balance_adjustments audit table if it doesn't exist
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='admin_balance_adjustments'", (err, tableExists) => {
    if (!tableExists) {
      db.run(`CREATE TABLE admin_balance_adjustments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        adminId INTEGER NOT NULL,
        userId INTEGER NOT NULL,
        accountType TEXT NOT NULL,
        operation TEXT NOT NULL,
        amount REAL NOT NULL,
        oldBalance REAL NOT NULL,
        newBalance REAL NOT NULL,
        reason TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (adminId) REFERENCES users(id),
        FOREIGN KEY (userId) REFERENCES users(id)
      )`, (err) => {
        if (err) {
          console.error('❌ Error creating admin_balance_adjustments table:', err);
        } else {
          console.log('✅ Admin balance adjustments audit table created');
        }
      });
    } else {
      console.log('✅ Admin balance adjustments audit table already exists');
    }
  });
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Admin middleware
const requireAdmin = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Configuration - Fast updates for real-time trading
const PRICE_UPDATE_INTERVAL = 500; // 500ms - much faster price updates
const CANDLE_UPDATE_INTERVAL = 1000; // 1 second - faster candlestick updates

let trades = [];
let nextTradeId = 1;
let demoBalance = 1000;
let realBalance = 0;

// Client interval tracking for dynamic timeframes
const clientIntervals = new Map();

// Data storage
let priceCache = {
  BTCUSDT: 45000,
  ETHUSDT: 3000,
  XRPUSDT: 0.5,
  LTCUSDT: 80,
  SOLUSDT: 100,
  ADAUSDT: 0.4,
  DOGEUSDT: 0.08,
  DOTUSDT: 7,
  AVAXUSDT: 25,
  LINKUSDT: 15
};

// Profit rates for each symbol
let profitRates = {
  "BTCUSDT": 91,
  "ETHUSDT": 85,
  "XRPUSDT": 80,
  "LTCUSDT": 80,
  "SOLUSDT": 80,
  "ADAUSDT": 80,
  "DOGEUSDT": 80,
  "DOTUSDT": 80,
  "AVAXUSDT": 80,
  "LINKUSDT": 80
};

// Admin authentication is now handled through the database user system
// Admin user credentials: username: "admin", password: "admin123"

// Generate realistic price data locally
function getRealTimePrice(symbol) {
  // Get current cached price or use default
  let currentPrice = priceCache[symbol];
  
  if (!currentPrice || currentPrice <= 0) {
    // Set default prices for symbols
    const defaultPrices = {
      BTCUSDT: 45000,
      ETHUSDT: 3000,
      XRPUSDT: 0.5,
      LTCUSDT: 80,
      SOLUSDT: 100,
      ADAUSDT: 0.4,
      DOGEUSDT: 0.08,
      DOTUSDT: 7,
      AVAXUSDT: 25,
      LINKUSDT: 15
    };
    currentPrice = defaultPrices[symbol] || 100;
    priceCache[symbol] = currentPrice;
  }
  
  // Add small random variation to simulate price movement (±0.5%)
  const variation = (Math.random() - 0.5) * 0.01; // ±0.5%
  const newPrice = currentPrice * (1 + variation);
  
  // Update cache with new price
  priceCache[symbol] = newPrice;
  
  return newPrice;
}

// Generate candlestick data locally
function getCandlestickData(symbol, interval = '1m', limit = 100) {
  const currentPrice = getRealTimePrice(symbol);
  const now = Math.floor(Date.now() / 1000);
  const candles = [];
  
  // Generate realistic candlestick data
  for (let i = limit - 1; i >= 0; i--) {
    const time = now - (i * 60); // 1 minute intervals
    const basePrice = currentPrice * (1 + (Math.random() - 0.5) * 0.02); // ±1% variation
    
    candles.push({
      time: time,
      open: basePrice,
      high: basePrice * (1 + Math.random() * 0.01),
      low: basePrice * (1 - Math.random() * 0.01),
      close: basePrice * (1 + (Math.random() - 0.5) * 0.005),
      volume: Math.random() * 1000 + 100
    });
  }
  
  return candles;
}

// Socket.io connection handling with user authentication
io.on("connection", (socket) => {
  console.log("Client connected with ID:", socket.id);
  
  // Store user info in socket
  socket.userId = null;
  socket.username = null;
  
  // Authenticate user via token
  socket.on("authenticate", (token) => {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.userId = decoded.id;
      socket.username = decoded.username;
      console.log(`✅ User authenticated: ${decoded.username} (ID: ${decoded.id})`);
      socket.emit("authenticated", { userId: decoded.id, username: decoded.username });
    } catch (error) {
      console.log("❌ Authentication failed:", error.message);
      socket.emit("authentication_error", { message: "Invalid token" });
    }
  });

  socket.on("test_connection", () => {
    console.log("✅ Connection test received from client:", socket.id);
    socket.emit("connection_test_response", { message: "Connection working!", timestamp: Date.now() });
  });

  socket.on("list_trades", () => {
    if (!socket.userId) {
      socket.emit("error", { message: "Authentication required" });
      return;
    }
    
    db.all("SELECT * FROM trades WHERE userId = ? ORDER BY entry_time DESC", [socket.userId], (err, rows) => {
      if (err) {
        console.error("❌ Error fetching trades:", err);
        socket.emit("error", { message: "Failed to fetch trades" });
        return;
      }
      
      console.log(`📋 Sending ${rows.length} trades for user ${socket.username} (ID: ${socket.userId})`);
      socket.emit("trade_list", rows);
    });
  });

  socket.on("get_balance", (data) => {
    if (!socket.userId) {
      socket.emit("error", { message: "Authentication required" });
      return;
    }
    
    db.get("SELECT demoBalance, realBalance FROM users WHERE id = ?", [socket.userId], (err, row) => {
      if (err) {
        console.error("❌ Error fetching balance:", err);
        socket.emit("error", { message: "Failed to fetch balance" });
        return;
      }
      
      const accountType = data?.accountType || "demo";
      const balance = accountType === "demo" ? row.demoBalance : row.realBalance;
      socket.emit("balance", balance);
    });
  });

  socket.on("update_balance", (data) => {
    if (!socket.userId) {
      socket.emit("error", { message: "Authentication required" });
      return;
    }
    
    const { accountType, balance } = data;
    const updateField = accountType === "demo" ? "demoBalance" : "realBalance";
    
    db.run(`UPDATE users SET ${updateField} = ? WHERE id = ?`, [balance, socket.userId], (err) => {
      if (err) {
        console.error("❌ Error updating balance:", err);
        socket.emit("error", { message: "Failed to update balance" });
        return;
      }
      
      socket.emit("balance", balance);
    });
  });

  // Test endpoint to check current prices
  socket.on("test_prices", () => {
    try {
      const symbols = ["BTCUSDT", "ETHUSDT"];
      symbols.forEach(symbol => {
        const price = getRealTimePrice(symbol);
        console.log(`Current real-time price for ${symbol}:`, price);
      });
    } catch (error) {
      console.error("Error testing prices:", error.message);
    }
  });

  // Test endpoint to check price for specific symbol
  socket.on("test_symbol_price", (symbol) => {
    try {
      console.log(`Testing price for symbol: ${symbol}`);
      const price = getRealTimePrice(symbol);
      console.log(`Current real-time price for ${symbol}:`, price);
      socket.emit("symbol_price_result", { symbol, price: price });
    } catch (error) {
      console.error(`Error testing price for ${symbol}:`, error.message);
      socket.emit("symbol_price_result", { symbol, error: error.message });
    }
  });

  // Clear all trades for testing
  socket.on("clear_trades", () => {
    trades = [];
    nextTradeId = 1;
    console.log("All trades cleared");
    io.emit("trade_list", trades);
  });

  // Admin authentication is now handled through regular user authentication system
  // Admin users can log in through /auth/login endpoint with their database credentials

  // Admin: Get current profit rates
  socket.on("get_profit_rates", () => {
    console.log("Admin requested profit rates");
    socket.emit("profit_rates_loaded", profitRates);
  });

  // Admin: Update profit rates
  socket.on("update_profit_rates", (newRates) => {
    try {
      console.log("Admin updating profit rates:", newRates);
      
             // Validate the new rates
       const validSymbols = ["BTCUSDT", "ETHUSDT", "XRPUSDT", "LTCUSDT", "SOLUSDT", "ADAUSDT", "DOGEUSDT", "DOTUSDT", "AVAXUSDT", "LINKUSDT"];
       for (let symbol of validSymbols) {
         if (typeof newRates[symbol] !== 'number' || newRates[symbol] < 0 || newRates[symbol] > 100) {
           throw new Error(`Invalid rate for ${symbol}: must be between 0 and 100`);
         }
       }
      
      profitRates = { ...newRates };
      
      // Notify all clients about the change
      io.emit("profit_rates_changed", profitRates);
      
      console.log("✅ Profit rates updated successfully");
      socket.emit("profit_rates_updated", { success: true, rates: profitRates });
      
    } catch (error) {
      console.error("❌ Error updating profit rates:", error.message);
      socket.emit("profit_rates_updated", { success: false, error: error.message });
    }
  });

  // Place trade
  socket.on("place_trade", async (tradeData) => {
    try {
      if (!socket.userId) {
        socket.emit("error", { message: "Authentication required" });
        return;
      }
      
      console.log(`🔵 Placing trade for user ${socket.username} (ID: ${socket.userId})`);
      console.log("🔵 Trade data received:", tradeData);
      
      const { symbol, side, amount, duration_seconds, accountType } = tradeData;
      
      // Validate trade data
      if (!symbol || !side || !amount || !duration_seconds) {
        throw new Error("Missing required trade data");
      }
      
      if (!["BTCUSDT", "ETHUSDT", "XRPUSDT", "LTCUSDT", "SOLUSDT", "ADAUSDT", "DOGEUSDT", "DOTUSDT", "AVAXUSDT", "LINKUSDT"].includes(symbol)) {
        throw new Error("Invalid symbol");
      }
      
      if (!["CALL", "PUT"].includes(side)) {
        throw new Error("Invalid trade side");
      }
      
      if (amount <= 0) {
        throw new Error("Invalid amount");
      }
      
      if (duration_seconds <= 0) {
        throw new Error("Invalid duration");
      }
      
      // Check user balance
      db.get("SELECT demoBalance, realBalance FROM users WHERE id = ?", [socket.userId], (err, row) => {
        if (err) {
          console.error("❌ Error fetching user balance:", err);
          socket.emit("error", { message: "Failed to fetch balance" });
          return;
        }
        
        const currentBalance = accountType === "demo" ? row.demoBalance : row.realBalance;
        if (currentBalance < amount) {
          socket.emit("error", { message: "Insufficient balance" });
          return;
        }
        
        // Get current price
        console.log("🔍 Getting current real-time price for symbol:", symbol);
        const entryPrice = getRealTimePrice(symbol);
        
        if (!entryPrice || entryPrice <= 0) {
          socket.emit("error", { message: "Unable to get current price" });
          return;
        }
        
        console.log("✅ Current real-time price for", symbol, ":", entryPrice);
        
        const placed_time = Math.floor(Date.now() / 1000);
        const expiry_time = placed_time + Number(duration_seconds);
        
        // Create trade in database
        db.run(`INSERT INTO trades (
          userId, symbol, side, amount, duration, entry_price, entry_time, 
          expiry_time, accountType
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
        [socket.userId, symbol, side, amount, duration_seconds, entryPrice, placed_time, expiry_time, accountType], 
        function(err) {
          if (err) {
            console.error("❌ Error creating trade:", err);
            socket.emit("error", { message: "Failed to create trade" });
            return;
          }
          
          const tradeId = this.lastID;
          
          // Update user balance
          const newBalance = currentBalance - amount;
          const updateField = accountType === "demo" ? "demoBalance" : "realBalance";
          
          db.run(`UPDATE users SET ${updateField} = ? WHERE id = ?`, [newBalance, socket.userId], (err) => {
            if (err) {
              console.error("❌ Error updating balance:", err);
              socket.emit("error", { message: "Failed to update balance" });
              return;
            }
            
            // Create trade object for response
            const trade = {
              id: tradeId,
              userId: socket.userId,
              symbol,
              side,
              amount: Number(amount),
              duration: Number(duration_seconds),
              entry_price: entryPrice,
              entry_time: placed_time,
              expiry_time,
              result: null,
              expiry_price: null,
              payout_amount: null,
              account_type: accountType
            };
            
            console.log("🎯 Created trade object:", trade);
            console.log("🎯 Trade entry price:", entryPrice);
            console.log("🎯 Trade symbol:", symbol);
            console.log("🎯 Trade side:", side);
            console.log("🎯 Trade amount:", amount);
            
            // Emit trade placed event
            console.log("📤 Emitting trade_placed with full trade object:", trade);
            socket.emit("trade_placed", trade);
            console.log("📤 Trade ID:", trade.id);
            
            // Schedule trade resolution
            setTimeout(async () => {
              await resolveTrade(trade.id);
            }, duration_seconds * 1000);
          });
        });
      });
    } catch (error) {
      console.error("❌ Error placing trade:", error.message);
      socket.emit("trade_error", { message: error.message });
    }
  });

  // Get initial candlestick data
  socket.on("get_initial_candles", async (data) => {
    try {
      const { symbol, limit = 100, interval = '1m' } = data;
      console.log(`📊 Client requested initial candles for ${symbol} ${interval}, limit: ${limit}`);
      
      // Store client's interval preference
      clientIntervals.set(socket.id, { symbol, interval });
      
      const candles = getCandlestickData(symbol, interval, limit);
      
      console.log(`📈 Sending ${candles.length} candles to client for ${symbol} ${interval}`);
      if (candles.length > 0) {
        console.log(`📊 First candle:`, candles[0]);
        console.log(`📊 Last candle:`, candles[candles.length - 1]);
      }
      
      socket.emit("initial_candles", {
        symbol: symbol,
        interval: interval,
        candles: candles,
        timestamp: Date.now()
      });
      
      console.log(`✅ Sent ${candles.length} initial candles for ${symbol} ${interval}`);
    } catch (error) {
      console.error(`❌ Error getting initial candles for ${data.symbol}:`, error.message);
      socket.emit("initial_candles", {
        symbol: data.symbol,
        candles: [],
        error: error.message,
        timestamp: Date.now()
      });
    }
  });

  // Health check endpoint
  socket.on("health_check", () => {
    const health = {
      status: 'healthy',
      timestamp: Date.now(),
      externalDataUrl: EXTERNAL_DATA_URL,
      priceCache: Object.keys(priceCache).length,
      trades: trades.length,
      demoBalance: demoBalance,
      realBalance: realBalance
    };
    socket.emit("health_status", health);
  });

  // Get order book endpoint (placeholder)
  socket.on("get_order_book", (symbol) => {
    socket.emit("order_book", { 
      symbol, 
      orderBook: {
        symbol: symbol,
        bids: [],
        asks: [],
        lastUpdateId: 0
      }
    });
  });

  // Get price with type endpoint
  socket.on("get_price", (data) => {
    const { symbol, type = 'mid' } = data;
    const price = priceCache[symbol] || 0;
    socket.emit("price_data", { symbol, type, price });
  });

  // Debug: Force candlestick update
  socket.on("force_candle_update", (data) => {
    try {
      const { symbol } = data;
      const clientData = clientIntervals.get(socket.id);
      const interval = clientData?.interval || '1m';
      console.log(`🔧 Force updating candlestick for ${symbol} ${interval}...`);
      
      const candles = getCandlestickData(symbol, interval, 100);
      
      if (candles.length > 0) {
        candlestickData[symbol] = candles;
        const latestCandle = candles[candles.length - 1];
        
        io.emit("kline", {
          symbol: symbol,
          interval: interval,
          candle: latestCandle,
          timestamp: Date.now()
        });
        
        console.log(`🔧 Force emitted candlestick for ${symbol} ${interval}:`, latestCandle);
      }
    } catch (error) {
      console.error(`❌ Error in force candle update:`, error.message);
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    // Clean up client interval preferences
    clientIntervals.delete(socket.id);
  });
});

// Resolve trade function
function resolveTrade(tradeId) {
  try {
    const trade = trades.find(t => t.id === tradeId);
    if (!trade) {
      console.log(`❌ Trade ${tradeId} not found`);
      return;
    }
    
    console.log(`🔍 Resolving trade ${tradeId}...`);
    
    // Get current price at expiry
    const expiryPrice = getRealTimePrice(trade.symbol);
    
    if (!expiryPrice || expiryPrice <= 0) {
      console.log(`❌ Unable to get expiry price for trade ${tradeId}`);
      return;
    }
    
    // Determine result
    let result = "LOSE";
    let payoutAmount = 0;
    
    if (trade.side === "CALL") {
      if (expiryPrice > trade.entry_price) {
        result = "WIN";
        const payout = profitRates[trade.symbol] || 91;
        payoutAmount = (trade.amount * payout) / 100;
      } else if (expiryPrice === trade.entry_price) {
        result = "REFUND";
        payoutAmount = trade.amount;
      }
    } else if (trade.side === "PUT") {
      if (expiryPrice < trade.entry_price) {
        result = "WIN";
        const payout = profitRates[trade.symbol] || 91;
        payoutAmount = (trade.amount * payout) / 100;
      } else if (expiryPrice === trade.entry_price) {
        result = "REFUND";
        payoutAmount = trade.amount;
      }
    }
    
    // Update trade
    trade.result = result;
    trade.expiry_price = expiryPrice;
    trade.payout_amount = payoutAmount;
    
    // Update balance
    if (trade.account_type === "demo") {
      if (result === "WIN") {
        demoBalance += trade.amount + payoutAmount;
        console.log(`Trade #${tradeId} WON! Payout: $${payoutAmount}, New demo balance: $${demoBalance}`);
      } else if (result === "REFUND") {
        demoBalance += trade.amount;
        console.log(`Trade #${tradeId} REFUNDED! Amount: $${trade.amount}, New demo balance: $${demoBalance}`);
      } else {
        console.log(`Trade #${tradeId} LOST! No payout, Demo balance remains: $${demoBalance}`);
      }
    } else {
      if (result === "WIN") {
        realBalance += trade.amount + payoutAmount;
        console.log(`Trade #${tradeId} WON! Payout: $${payoutAmount}, New real balance: $${realBalance}`);
      } else if (result === "REFUND") {
        realBalance += trade.amount;
        console.log(`Trade #${tradeId} REFUNDED! Amount: $${trade.amount}, New real balance: $${realBalance}`);
      } else {
        console.log(`Trade #${tradeId} LOST! No payout, Real balance remains: $${realBalance}`);
      }
    }
    
    console.log(`Trade #${tradeId} resolved: ${trade.side} ${trade.symbol} Entry: ${trade.entry_price} Expiry: ${expiryPrice} Result: ${result}`);
    
    // Emit trade resolved event
    io.emit("trade_resolved", { tradeId, result, payoutAmount });
    
    // Emit updated trade list
    io.emit("trade_list", trades);
    
  } catch (error) {
    console.error(`❌ Error resolving trade ${tradeId}:`, error.message);
  }
}

// Periodic price updates - very frequent
setInterval(() => {
  const symbols = ["BTCUSDT", "ETHUSDT", "XRPUSDT", "LTCUSDT", "SOLUSDT", "ADAUSDT", "DOGEUSDT", "DOTUSDT", "AVAXUSDT", "LINKUSDT"];
  
  symbols.forEach(symbol => {
    try {
      const price = getRealTimePrice(symbol);
      
      if (price > 0) {
        io.emit("price_update", {
          symbol: symbol,
          price: price,
          timestamp: Date.now()
        });
        
        // Also emit a "tick" event for very frequent updates
        io.emit("price_tick", {
          symbol: symbol,
          price: price,
          timestamp: Date.now()
        });
      }
    } catch (e) {
      // Only log error for supported symbols to reduce console spam
      if (["BTCUSDT", "ETHUSDT", "XRPUSDT", "LTCUSDT", "SOLUSDT", "ADAUSDT", "DOGEUSDT", "DOTUSDT", "AVAXUSDT", "LINKUSDT"].includes(symbol)) {
        console.error(`❌ Failed to get price for ${symbol}:`, e.message);
      }
    }
  });
}, PRICE_UPDATE_INTERVAL);

// Periodic candlestick updates - support multiple intervals
setInterval(() => {
  // Get unique symbol-interval combinations from connected clients
  const intervalRequests = new Map();
  
  // Collect all client interval preferences
  clientIntervals.forEach((clientData, socketId) => {
    const { symbol, interval } = clientData;
    const key = `${symbol}-${interval}`;
    if (!intervalRequests.has(key)) {
      intervalRequests.set(key, { symbol, interval });
    }
  });
  
  // Fetch data for each unique symbol-interval combination
  intervalRequests.forEach(({ symbol, interval }, key) => {
    try {
      const candles = getCandlestickData(symbol, interval, 100);
      
      if (candles.length > 0) {
        const currentLatest = candles[candles.length - 1];
        
        // Store candles by symbol-interval combination
        candlestickData[key] = candles;
        
        // Emit to clients who are watching this symbol-interval combination
        clientIntervals.forEach((clientData, socketId) => {
          if (clientData.symbol === symbol && clientData.interval === interval) {
            const clientSocket = io.sockets.sockets.get(socketId);
            if (clientSocket) {
              clientSocket.emit("kline", {
                symbol: symbol,
                interval: interval,
                candle: currentLatest,
                timestamp: Date.now()
              });
              
              // Also emit price update immediately for real-time sync
              clientSocket.emit("price_update", {
                symbol: symbol,
                price: currentLatest.close,
                timestamp: Date.now()
              });
            }
          }
        });
        
        // Also emit price update for current price display (for all clients watching this symbol)
        io.emit("price_update", {
          symbol: symbol,
          price: currentLatest.close,
          timestamp: Date.now()
        });
        
        // Only log errors, not successful updates to reduce console spam
      }
    } catch (e) {
      // Only log error for supported symbols to reduce console spam
      if (["BTCUSDT", "ETHUSDT", "XRPUSDT", "LTCUSDT", "SOLUSDT", "ADAUSDT", "DOGEUSDT", "DOTUSDT", "AVAXUSDT", "LINKUSDT"].includes(symbol)) {
        console.error(`❌ Failed to get candlestick data for ${symbol} ${interval}:`, e.message);
      }
    }
  });
}, CANDLE_UPDATE_INTERVAL);

// Authentication Routes
app.post('/auth/signup', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    // Check if user already exists
    db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (row) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      
      // Hash password and create user
      const hashedPassword = bcrypt.hashSync(password, 10);
      db.run("INSERT INTO users (username, password) VALUES (?, ?)", 
        [username, hashedPassword], function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to create user' });
          }
          
          // Create JWT token
          const token = jwt.sign(
            { id: this.lastID, username, isAdmin: false },
            JWT_SECRET,
            { expiresIn: '24h' }
          );
          
          res.json({
            message: 'User created successfully',
            token,
            user: { id: this.lastID, username, isAdmin: false }
          });
        });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!row) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Check password
      const isValidPassword = bcrypt.compareSync(password, row.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Create JWT token
      const token = jwt.sign(
        { id: row.id, username: row.username, isAdmin: row.isAdmin },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      res.json({
        message: 'Login successful',
        token,
        user: { 
          id: row.id, 
          username: row.username, 
          isAdmin: row.isAdmin,
          demoBalance: row.demoBalance,
          realBalance: row.realBalance
        }
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/auth/me', authenticateToken, (req, res) => {
  db.get("SELECT id, username, isAdmin, demoBalance, realBalance FROM users WHERE id = ?", 
    [req.user.id], (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!row) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json({
        user: {
          id: row.id,
          username: row.username,
          isAdmin: row.isAdmin,
          demoBalance: row.demoBalance,
          realBalance: row.realBalance
        }
      });
    });
});

// Protected routes for user data
app.get('/api/user/balance', authenticateToken, (req, res) => {
  db.get("SELECT demoBalance, realBalance FROM users WHERE id = ?", 
    [req.user.id], (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({
        demoBalance: row.demoBalance,
        realBalance: row.realBalance
      });
    });
});

app.put('/api/user/balance', authenticateToken, (req, res) => {
  const { demoBalance, realBalance } = req.body;
  
  db.run("UPDATE users SET demoBalance = ?, realBalance = ? WHERE id = ?", 
    [demoBalance, realBalance, req.user.id], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to update balance' });
      }
      
      res.json({ message: 'Balance updated successfully' });
    });
});

// User-specific trade management endpoints
app.get('/api/user/trades', authenticateToken, (req, res) => {
  const { status, accountType } = req.query;
  let query = "SELECT * FROM trades WHERE userId = ?";
  const params = [req.user.id];
  
  if (status === 'active') {
    query += " AND result IS NULL";
  } else if (status === 'completed') {
    query += " AND result IS NOT NULL";
  }
  
  if (accountType) {
    query += " AND accountType = ?";
    params.push(accountType);
  }
  
  query += " ORDER BY entry_time DESC";
  
  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch trades' });
    }
    
    // Add durationSec field to each trade
    const tradesWithDuration = rows.map(trade => ({
      ...trade,
      durationSec: trade.duration || (trade.expiry_time - trade.entry_time)
    }));
    
    res.json({ trades: tradesWithDuration });
  });
});

app.post('/api/user/trades', authenticateToken, (req, res) => {
  const { symbol, side, amount, duration, entry_price, account_type } = req.body;
  
  if (!symbol || !side || !amount || !duration || !entry_price || !account_type) {
    return res.status(400).json({ error: 'Missing required trade data' });
  }
  
  const entry_time = Math.floor(Date.now() / 1000);
  const expiry_time = entry_time + duration;
  
  db.run(`INSERT INTO trades (
    userId, symbol, side, amount, duration, entry_price, entry_time, 
    expiry_time, accountType
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
  [req.user.id, symbol, side, amount, duration, entry_price, entry_time, expiry_time, account_type], 
  function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to create trade' });
    }
    
    res.json({ 
      message: 'Trade created successfully',
      tradeId: this.lastID
    });
  });
});

app.put('/api/user/trades/:tradeId', authenticateToken, (req, res) => {
  const { tradeId } = req.params;
  const { result, expiry_price, payout_amount } = req.body;
  
  db.run("UPDATE trades SET result = ?, expiry_price = ?, payout_amount = ? WHERE id = ? AND userId = ?", 
    [result, expiry_price, payout_amount, tradeId, req.user.id], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to update trade' });
      }
      
      res.json({ message: 'Trade updated successfully' });
    });
});

app.get('/api/user/trades/:tradeId', authenticateToken, (req, res) => {
  const { tradeId } = req.params;
  
  db.get("SELECT * FROM trades WHERE id = ? AND userId = ?", 
    [tradeId, req.user.id], (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!row) {
        return res.status(404).json({ error: 'Trade not found' });
      }
      
      res.json({ trade: row });
    });
});

// Admin API endpoints
app.get('/api/admin/users', authenticateToken, requireAdmin, (req, res) => {
  const { page = 1, pageSize = 50 } = req.query;
  const offset = (page - 1) * pageSize;
  
  // Query to get all users with their balances and active trade counts
  const query = `
    SELECT 
      u.id,
      u.username,
      COALESCE(u.demoBalance, 0) AS demoBalance,
      COALESCE(u.realBalance, 0) AS realBalance,
      (SELECT COUNT(1) FROM trades t WHERE t.userId = u.id AND t.result IS NULL) AS activeTradesCount
    FROM users u
    ORDER BY u.id
    LIMIT ? OFFSET ?
  `;
  
  db.all(query, [pageSize, offset], (err, rows) => {
    if (err) {
      console.error('Error fetching users:', err);
      return res.status(500).json({ error: 'Failed to fetch users' });
    }
    
    // Format the response
    const users = rows.map(user => ({
      id: user.id,
      username: user.username,
      demoBalance: parseFloat(user.demoBalance || 0).toFixed(2),
      realBalance: parseFloat(user.realBalance || 0).toFixed(2),
      activeTradesCount: user.activeTradesCount || 0
    }));
    
    res.json(users);
  });
});

// Admin Balance Adjustment endpoint
app.patch('/api/admin/users/:id/balance', authenticateToken, requireAdmin, (req, res) => {
  const userId = parseInt(req.params.id);
  const { accountType, operation, amount, reason } = req.body;
  const adminId = req.user.id;

  // Validation
  if (!['real', 'demo'].includes(accountType)) {
    return res.status(400).json({ error: 'Invalid accountType. Must be "real" or "demo"' });
  }

  if (!['set', 'add', 'subtract'].includes(operation)) {
    return res.status(400).json({ error: 'Invalid operation. Must be "set", "add", or "subtract"' });
  }

  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Amount must be a positive number' });
  }

  // Validate amount has max 2 decimal places
  if (amount.toString().includes('.') && amount.toString().split('.')[1].length > 2) {
    return res.status(400).json({ error: 'Amount can have maximum 2 decimal places' });
  }

  // Use database transaction for atomicity
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    // Get current balance
    const balanceColumn = accountType === 'real' ? 'realBalance' : 'demoBalance';
    db.get(`SELECT ${balanceColumn} FROM users WHERE id = ?`, [userId], (err, row) => {
      if (err) {
        db.run('ROLLBACK');
        console.error('Error fetching current balance:', err);
        return res.status(500).json({ error: 'Failed to fetch current balance' });
      }

      if (!row) {
        db.run('ROLLBACK');
        return res.status(404).json({ error: 'User not found' });
      }

      const oldBalance = parseFloat(row[balanceColumn] || 0);
      let newBalance;

      // Calculate new balance based on operation
      switch (operation) {
        case 'set':
          newBalance = parseFloat(amount);
          break;
        case 'add':
          newBalance = oldBalance + parseFloat(amount);
          break;
        case 'subtract':
          newBalance = oldBalance - parseFloat(amount);
          if (newBalance < 0) {
            db.run('ROLLBACK');
            return res.status(400).json({ error: 'Insufficient balance for subtraction' });
          }
          break;
        default:
          db.run('ROLLBACK');
          return res.status(400).json({ error: 'Invalid operation' });
      }

      // Update balance
      db.run(`UPDATE users SET ${balanceColumn} = ? WHERE id = ?`, [newBalance, userId], function(err) {
        if (err) {
          db.run('ROLLBACK');
          console.error('Error updating balance:', err);
          return res.status(500).json({ error: 'Failed to update balance' });
        }

        // Insert audit log
        db.run(`INSERT INTO admin_balance_adjustments 
          (adminId, userId, accountType, operation, amount, oldBalance, newBalance, reason) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
          [adminId, userId, accountType, operation, amount, oldBalance, newBalance, reason || null], 
          function(err) {
            if (err) {
              db.run('ROLLBACK');
              console.error('Error inserting audit log:', err);
              return res.status(500).json({ error: 'Failed to log adjustment' });
            }

            // Commit transaction
            db.run('COMMIT', (err) => {
              if (err) {
                console.error('Error committing transaction:', err);
                return res.status(500).json({ error: 'Failed to commit adjustment' });
              }

              // Emit socket event to update user's UI in real-time
              io.to(`user:${userId}`).emit('balance:update', {
                accountType,
                newBalance: parseFloat(newBalance).toFixed(2)
              });

              console.log(`💰 Admin ${adminId} adjusted ${accountType} balance for user ${userId}: ${oldBalance} → ${newBalance} (${operation} ${amount})`);

              res.json({
                success: true,
                userId,
                accountType,
                oldBalance: parseFloat(oldBalance).toFixed(2),
                newBalance: parseFloat(newBalance).toFixed(2),
                adjustedAt: new Date().toISOString()
              });
            });
          });
      });
    });
  });
});

// REST API endpoints
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: Date.now(),
    priceCache: Object.keys(priceCache).length,
    trades: trades.length
  });
});

app.get('/metrics', (req, res) => {
  res.json({
    trades: trades.length,
    demoBalance: demoBalance,
    realBalance: realBalance,
    profitRates: profitRates
  });
});

app.get('/orderbook/:symbol', (req, res) => {
  const { symbol } = req.params;
  res.json({
    symbol: symbol,
    bids: [],
    asks: [],
    lastUpdateId: 0
  });
});

app.get('/price/:symbol', (req, res) => {
  const { symbol } = req.params;
  res.json({
    symbol: symbol,
    price: priceCache[symbol] || 0,
    timestamp: Date.now()
  });
});

// Initialize local price data
function initializeData() {
  console.log("🚀 Initializing local price data...");
  
  // Initialize prices for all supported symbols
  const symbols = ["BTCUSDT", "ETHUSDT", "XRPUSDT", "LTCUSDT", "SOLUSDT", "ADAUSDT", "DOGEUSDT", "DOTUSDT", "AVAXUSDT", "LINKUSDT"];
  
  symbols.forEach(symbol => {
    getRealTimePrice(symbol); // This will set initial prices
  });
  
  console.log("✅ Local price data initialized");
  console.log("📊 Current prices:", priceCache);
}

server.listen(4000, () => {
  console.log("Server running on port 4000");
  console.log("🔗 Using local price generation");
  initializeData();
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Shutting down server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 Shutting down server...');
  process.exit(0);
});
